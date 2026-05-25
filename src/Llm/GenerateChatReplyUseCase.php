<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

use RuntimeException;

final readonly class GenerateChatReplyUseCase implements GenerateChatReplyUseCaseInterface
{
    private const MAX_TOOL_ROUNDS = 3;

    private const SYSTEM_PROMPT = <<<'PROMPT'
        You are a helpful assistant for a company website knowledge chat.
        Use the search_corpus tool to find relevant passages before answering.
        Ground every answer in retrieved corpus chunks. If search returns no relevant results, say you do not know.
        Do not invent product facts or policies that are not supported by search results.
        PROMPT;

    public function __construct(
        private ClaudeMessagesClientInterface $client,
        private CorpusSearchToolHandler $searchTool,
    ) {
    }

    public function execute(GenerateChatReplyInput $input): GenerateChatReplyOutput
    {
        $messages = $this->toAnthropicMessages($input->history, $input->userMessage);
        $tools = [CorpusSearchToolDefinition::schema()];
        $citations = [];

        for ($round = 0; $round < self::MAX_TOOL_ROUNDS; ++$round) {
            $response = $this->client->createMessage(self::SYSTEM_PROMPT, $messages, $tools);

            if ($response->stopReason !== 'tool_use') {
                $text = $response->text();

                if ($text === null || trim($text) === '') {
                    throw new RuntimeException('Claude response did not contain assistant text.');
                }

                return new GenerateChatReplyOutput(
                    content: trim($text),
                    citations: $this->uniqueCitations($citations),
                );
            }

            $toolUses = $response->toolUses();

            if ($toolUses === []) {
                throw new RuntimeException('Claude requested tool_use without tool blocks.');
            }

            $messages[] = [
                'role' => 'assistant',
                'content' => $response->contentBlocks,
            ];

            $toolResults = [];

            foreach ($toolUses as $toolUse) {
                if ($toolUse->name !== CorpusSearchToolDefinition::NAME) {
                    throw new RuntimeException('Unexpected tool requested: ' . $toolUse->name);
                }

                $query = is_string($toolUse->input['query'] ?? null)
                    ? trim((string) $toolUse->input['query'])
                    : $input->userMessage;

                $searchResult = $this->searchTool->execute($query);
                $citations = [...$citations, ...$searchResult['citations']];

                $toolResults[] = [
                    'type' => 'tool_result',
                    'tool_use_id' => $toolUse->id,
                    'content' => $searchResult['tool_result'],
                ];
            }

            $messages[] = [
                'role' => 'user',
                'content' => $toolResults,
            ];
        }

        throw new RuntimeException('Exceeded maximum Claude tool_use rounds.');
    }

    /**
     * @param list<ConversationTurn> $history
     * @return list<array<string, mixed>>
     */
    private function toAnthropicMessages(array $history, string $userMessage): array
    {
        $messages = [];

        foreach ($history as $turn) {
            $messages[] = [
                'role' => $turn->role,
                'content' => $turn->content,
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $userMessage,
        ];

        return $messages;
    }

    /**
     * @param list<Citation> $citations
     * @return list<Citation>
     */
    private function uniqueCitations(array $citations): array
    {
        $unique = [];
        $seen = [];

        foreach ($citations as $citation) {
            if (isset($seen[$citation->chunkId])) {
                continue;
            }

            $seen[$citation->chunkId] = true;
            $unique[] = $citation;
        }

        return $unique;
    }
}

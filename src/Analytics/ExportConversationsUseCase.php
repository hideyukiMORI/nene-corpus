<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

final readonly class ExportConversationsUseCase implements ExportConversationsUseCaseInterface
{
    public function __construct(
        private AnalyticsRepositoryInterface $repo,
    ) {
    }

    public function execute(ExportConversationsInput $input): ExportConversationsOutput
    {
        $dateSuffix = $this->dateSuffix($input->from, $input->to);

        if ($input->format === ExportConversationsInput::FORMAT_CONVERSATIONS) {
            return $this->buildConversations($input, $dateSuffix);
        }

        return $this->buildSessions($input, $dateSuffix);
    }

    private function buildSessions(ExportConversationsInput $input, string $dateSuffix): ExportConversationsOutput
    {
        $rows    = $this->repo->exportSessions($input->from, $input->to);
        $headers = ['session_id', 'created_at', 'client_ip', 'referer', 'user_agent', 'message_count', 'input_tokens', 'output_tokens', 'has_citation'];

        $csvRows = array_map(
            static fn (array $row): array => [
                (string) ($row['session_id'] ?? ''),
                (string) ($row['created_at'] ?? ''),
                (string) ($row['client_ip'] ?? ''),
                (string) ($row['referer'] ?? ''),
                (string) ($row['user_agent'] ?? ''),
                (string) ($row['message_count'] ?? '0'),
                (string) ($row['input_tokens'] ?? '0'),
                (string) ($row['output_tokens'] ?? '0'),
                ((int) ($row['has_citation'] ?? 0)) === 1 ? 'true' : 'false',
            ],
            $rows,
        );

        return new ExportConversationsOutput(
            filename: "nene-corpus-sessions{$dateSuffix}.csv",
            headers:  $headers,
            rows:     $csvRows,
        );
    }

    private function buildConversations(ExportConversationsInput $input, string $dateSuffix): ExportConversationsOutput
    {
        $rows    = $this->repo->exportConversations($input->from, $input->to);
        $headers = ['session_id', 'session_created_at', 'client_ip', 'referer', 'message_id', 'role', 'content', 'input_tokens', 'output_tokens', 'has_citation', 'message_created_at'];

        $csvRows = array_map(
            static fn (array $row): array => [
                (string) ($row['session_id'] ?? ''),
                (string) ($row['session_created_at'] ?? ''),
                (string) ($row['client_ip'] ?? ''),
                (string) ($row['referer'] ?? ''),
                (string) ($row['message_id'] ?? ''),
                (string) ($row['role'] ?? ''),
                (string) ($row['content'] ?? ''),
                (string) ($row['input_tokens'] ?? '0'),
                (string) ($row['output_tokens'] ?? '0'),
                ((int) ($row['has_citation'] ?? 0)) === 1 ? 'true' : 'false',
                (string) ($row['message_created_at'] ?? ''),
            ],
            $rows,
        );

        return new ExportConversationsOutput(
            filename: "nene-corpus-conversations{$dateSuffix}.csv",
            headers:  $headers,
            rows:     $csvRows,
        );
    }

    private function dateSuffix(?string $from, ?string $to): string
    {
        if ($from !== null && $to !== null) {
            return "-{$from}-{$to}";
        }

        if ($from !== null) {
            return "-from-{$from}";
        }

        if ($to !== null) {
            return "-to-{$to}";
        }

        return '';
    }
}

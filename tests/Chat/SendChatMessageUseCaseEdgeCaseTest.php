<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Chat;

use InvalidArgumentException;
use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use Nene2\Validation\ValidationException;
use NeneCorpus\Chat\ChatSessionNotFoundException;
use NeneCorpus\Chat\SendChatMessageInput;
use NeneCorpus\Chat\SendChatMessageUseCase;
use NeneCorpus\ChatLimits\ChatLimitsRepositoryInterface;
use NeneCorpus\ChatLimits\ChatLimitsSettings;
use NeneCorpus\ChatLimits\ChatTokenTrackerInterface;
use NeneCorpus\Llm\Citation;
use NeneCorpus\Llm\GenerateChatReplyOutput;
use NeneCorpus\Llm\GenerateChatReplyUseCaseInterface;
use NeneCorpus\Message\PdoChatMessageRepository;
use NeneCorpus\Session\ChatSession;
use NeneCorpus\Session\PdoChatSessionRepository;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use NeneCorpus\Tests\Support\ChatSchemaSetup;
use PHPUnit\Framework\TestCase;

/**
 * SendChatMessageUseCase のエッジケース・敵対的テスト。
 *
 * 攻撃シナリオ:
 *  - 無効なセッショントークンで送信
 *  - 空白のみのメッセージを送信
 *  - 文字数制限を超えたメッセージを送信
 *  - limit = 0 のときは制限なしになるか確認
 *  - トークン追跡は入出力トークンが 0 のときはスキップされる
 *  - 会話履歴は「直前のユーザーターンを含まない」ことを検証
 */
final class SendChatMessageUseCaseEdgeCaseTest extends TestCase
{
    private PdoDatabaseQueryExecutor $executor;
    private PdoChatSessionRepository $sessions;
    private PdoChatMessageRepository $messages;

    protected function setUp(): void
    {
        $this->executor = new PdoDatabaseQueryExecutor(new PdoConnectionFactory(new DatabaseConfig(
            null,
            'test',
            'sqlite',
            'localhost',
            1,
            ':memory:',
            'nene_corpus',
            '',
            'utf8',
        )));

        ChatSchemaSetup::create($this->executor);

        $holder = new RequestScopedOrgIdHolder();
        $holder->setId(1);

        $this->sessions = new PdoChatSessionRepository($this->executor, $holder);
        $this->messages = new PdoChatMessageRepository($this->executor, $holder);
    }

    // ── セッションエラー ───────────────────────────────────────────────

    public function test_execute_throws_for_nonexistent_session_token(): void
    {
        $this->expectException(ChatSessionNotFoundException::class);

        $this->buildUseCase()->execute(new SendChatMessageInput(
            sessionToken: 'no-such-token',
            content: 'Hello?',
        ));
    }

    // ── コンテンツバリデーション ──────────────────────────────────────

    public function test_execute_throws_for_whitespace_only_content(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-1'));

        $this->expectException(InvalidArgumentException::class);

        $this->buildUseCase()->execute(new SendChatMessageInput(
            sessionToken: 'tok-1',
            content: '   ',
        ));
    }

    public function test_execute_throws_for_empty_content(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-2'));

        $this->expectException(InvalidArgumentException::class);

        $this->buildUseCase()->execute(new SendChatMessageInput(
            sessionToken: 'tok-2',
            content: '',
        ));
    }

    // ── 文字数制限 ────────────────────────────────────────────────────

    public function test_execute_throws_when_content_exceeds_max_chars(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-3'));

        $this->expectException(ValidationException::class);

        $this->buildUseCase(maxMessageChars: 10)->execute(new SendChatMessageInput(
            sessionToken: 'tok-3',
            content: str_repeat('a', 11), // 11文字で上限10を超える
        ));
    }

    public function test_execute_throws_with_field_content_when_too_long(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-4'));

        try {
            $this->buildUseCase(maxMessageChars: 5)->execute(new SendChatMessageInput(
                sessionToken: 'tok-4',
                content: str_repeat('x', 6),
            ));
            self::fail('ValidationException expected');
        } catch (ValidationException $e) {
            $fields = array_map(fn ($err) => $err->field, $e->errors());
            self::assertContains('content', $fields);
        }
    }

    public function test_execute_succeeds_when_content_is_exactly_at_max_chars(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-5'));

        // 境界値: ちょうど 10 文字 → 成功
        $output = $this->buildUseCase(maxMessageChars: 10)->execute(new SendChatMessageInput(
            sessionToken: 'tok-5',
            content: str_repeat('a', 10),
        ));

        self::assertSame('assistant', $output->role);
    }

    public function test_execute_ignores_char_limit_when_max_is_zero(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-6'));

        // maxMessageChars = 0 → 制限なし
        $output = $this->buildUseCase(maxMessageChars: 0)->execute(new SendChatMessageInput(
            sessionToken: 'tok-6',
            content: str_repeat('a', 100000),
        ));

        self::assertSame('assistant', $output->role);
    }

    // ── トークン追跡 ──────────────────────────────────────────────────

    public function test_execute_does_not_track_tokens_when_both_are_zero(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-7'));

        $tracker = $this->createMock(ChatTokenTrackerInterface::class);
        $tracker->expects(self::never())->method('track');

        $this->buildUseCase(tracker: $tracker, inputTokens: 0, outputTokens: 0)->execute(
            new SendChatMessageInput(sessionToken: 'tok-7', content: 'Hello'),
        );
    }

    public function test_execute_tracks_tokens_when_input_tokens_positive(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-8'));

        $tracker = $this->createMock(ChatTokenTrackerInterface::class);
        $tracker->expects(self::once())
            ->method('track')
            ->with(self::anything(), 100, 0);

        $this->buildUseCase(tracker: $tracker, inputTokens: 100, outputTokens: 0)->execute(
            new SendChatMessageInput(sessionToken: 'tok-8', content: 'Hello'),
        );
    }

    public function test_execute_tracks_tokens_when_output_tokens_positive(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-9'));

        $tracker = $this->createMock(ChatTokenTrackerInterface::class);
        $tracker->expects(self::once())
            ->method('track')
            ->with(self::anything(), 0, 50);

        $this->buildUseCase(tracker: $tracker, inputTokens: 0, outputTokens: 50)->execute(
            new SendChatMessageInput(sessionToken: 'tok-9', content: 'Hello'),
        );
    }

    public function test_execute_passes_client_ip_to_token_tracker(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-10'));

        $tracker = $this->createMock(ChatTokenTrackerInterface::class);
        $tracker->expects(self::once())
            ->method('track')
            ->with('192.168.1.1', self::anything(), self::anything());

        $this->buildUseCase(tracker: $tracker, inputTokens: 10, outputTokens: 10)->execute(
            new SendChatMessageInput(sessionToken: 'tok-10', content: 'Hello', clientIp: '192.168.1.1'),
        );
    }

    // ── 会話履歴の構築 ────────────────────────────────────────────────

    public function test_execute_passes_empty_history_for_first_message(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-hist-1'));

        $generateReply = $this->createMock(GenerateChatReplyUseCaseInterface::class);
        $generateReply->expects(self::once())
            ->method('execute')
            ->with(self::callback(fn ($input) => $input->history === []))
            ->willReturn(new GenerateChatReplyOutput(content: 'First reply', citations: []));

        $this->buildUseCase(generateReply: $generateReply)->execute(
            new SendChatMessageInput(sessionToken: 'tok-hist-1', content: 'First question'),
        );
    }

    public function test_execute_excludes_current_user_message_from_history(): void
    {
        // セッションを作成して1往復目を完了させる
        $sessionId = $this->sessions->save(new ChatSession(publicToken: 'tok-hist-2'));

        // 1往復目
        $this->buildUseCase()->execute(
            new SendChatMessageInput(sessionToken: 'tok-hist-2', content: 'First question'),
        );

        // 2往復目: 履歴には [user, assistant] の1往復目が入り、
        // 現在のユーザーメッセージ「Second question」は history に含まれない
        $generateReply = $this->createMock(GenerateChatReplyUseCaseInterface::class);
        $generateReply->expects(self::once())
            ->method('execute')
            ->with(self::callback(function ($input): bool {
                // history に2エントリ: user=First question, assistant=Assistant answer.
                self::assertCount(2, $input->history);
                self::assertSame('user', $input->history[0]->role);
                self::assertSame('First question', $input->history[0]->content);
                self::assertSame('assistant', $input->history[1]->role);

                return true;
            }))
            ->willReturn(new GenerateChatReplyOutput(content: 'Second reply', citations: []));

        $this->buildUseCase(generateReply: $generateReply)->execute(
            new SendChatMessageInput(sessionToken: 'tok-hist-2', content: 'Second question'),
        );
    }

    // ── 出力内容 ──────────────────────────────────────────────────────

    public function test_execute_output_contains_citations(): void
    {
        $this->sessions->save(new ChatSession(publicToken: 'tok-cit'));

        $generateReply = $this->createStub(GenerateChatReplyUseCaseInterface::class);
        $generateReply->method('execute')
            ->willReturn(new GenerateChatReplyOutput(
                content: 'Answer with citation',
                citations: [
                    new Citation(chunkId: 1, documentId: 2, sourceId: 3, excerpt: 'Excerpt.'),
                    new Citation(chunkId: 4, documentId: 5, sourceId: 6, excerpt: 'Another.'),
                ],
            ));

        $output = $this->buildUseCase(generateReply: $generateReply)->execute(
            new SendChatMessageInput(sessionToken: 'tok-cit', content: 'What is?'),
        );

        self::assertCount(2, $output->citations);
        self::assertSame(1, $output->citations[0]->chunkId);
        self::assertSame('Excerpt.', $output->citations[0]->excerpt);
    }

    // ── ヘルパー ──────────────────────────────────────────────────────

    private function buildUseCase(
        int $maxMessageChars = 0,
        ?ChatTokenTrackerInterface $tracker = null,
        ?GenerateChatReplyUseCaseInterface $generateReply = null,
        int $inputTokens = 0,
        int $outputTokens = 0,
    ): SendChatMessageUseCase {
        if ($tracker === null) {
            $tracker = $this->createStub(ChatTokenTrackerInterface::class);
        }

        if ($generateReply === null) {
            $mock = $this->createStub(GenerateChatReplyUseCaseInterface::class);
            $mock->method('execute')->willReturn(new GenerateChatReplyOutput(
                content: 'Assistant answer.',
                citations: [],
                inputTokens: $inputTokens,
                outputTokens: $outputTokens,
            ));
            $generateReply = $mock;
        }

        $limitsRepo = $this->createStub(ChatLimitsRepositoryInterface::class);
        $limitsRepo->method('get')->willReturn(new ChatLimitsSettings(
            maxMessageChars: $maxMessageChars,
            messageIntervalSeconds: 0,
            sessionRequestsPerHour: 0,
            ipRequestsPerHour: 0,
            dailyRequestsPerIp: 0,
            dailyRequestsGlobal: 0,
            dailyTokensPerIp: 0,
            dailyTokensGlobal: 0,
        ));

        return new SendChatMessageUseCase(
            $this->sessions,
            $this->messages,
            $generateReply,
            $limitsRepo,
            $tracker,
        );
    }
}

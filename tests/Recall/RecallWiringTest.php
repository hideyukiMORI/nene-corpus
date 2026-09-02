<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Recall;

use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Chunk\IndexedChunkRepository;
use NeneCorpus\Chunk\PdoChunkRepository;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Recall\HttpRecallClient;
use NeneCorpus\Recall\NullRecallClient;
use NeneCorpus\Recall\RecallClientInterface;
use NeneCorpus\Search\ChunkSearchRepositoryInterface;
use NeneCorpus\Search\PdoChunkSearchRepository;
use NeneCorpus\Search\RecallChunkSearchRepository;
use PHPUnit\Framework\TestCase;
use Psr\Container\ContainerInterface;

/**
 * The switch itself, asserted through the real container.
 *
 * The promise of ADR 0007 is that an installation which never sets
 * NENE_RECALL_BASE_URL keeps the search and ingestion it already had. That
 * promise lives entirely in two service providers, so it is worth pinning: a
 * future refactor that binds the Recall repository unconditionally would start
 * making HTTP calls on every ingest of every existing deployment.
 */
final class RecallWiringTest extends TestCase
{
    private const KEYS = ['NENE_RECALL_BASE_URL', 'NENE_RECALL_BEARER_TOKEN', 'DB_ADAPTER', 'DB_NAME'];

    /** @var array<string, string|null> */
    private array $saved = [];

    private string $databasePath;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (self::KEYS as $key) {
            $value = $_ENV[$key] ?? null;
            $this->saved[$key] = is_string($value) ? $value : null;
        }

        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-recall-wiring-' . uniqid('', true) . '.sqlite';

        $this->setEnv('DB_ADAPTER', 'sqlite');
        $this->setEnv('DB_NAME', $this->databasePath);
        // Empty rather than unset: `.env` is loaded with Dotenv's immutable
        // loader, which will not overwrite a key that is already present. A
        // developer whose own `.env` points at a Recall instance must not make
        // the "unconfigured" case silently test the configured one.
        $this->setEnv('NENE_RECALL_BASE_URL', '');
        $this->setEnv('NENE_RECALL_BEARER_TOKEN', '');
    }

    protected function tearDown(): void
    {
        foreach (self::KEYS as $key) {
            $this->setEnv($key, $this->saved[$key]);
        }

        if (is_file($this->databasePath)) {
            unlink($this->databasePath);
        }

        parent::tearDown();
    }

    private function setEnv(string $key, ?string $value): void
    {
        if ($value === null) {
            unset($_ENV[$key], $_SERVER[$key]);

            return;
        }

        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }

    private function container(): ContainerInterface
    {
        return (new RuntimeContainerFactory())->create();
    }

    public function test_without_a_base_url_nothing_changes(): void
    {
        $container = $this->container();

        self::assertInstanceOf(PdoChunkSearchRepository::class, $container->get(ChunkSearchRepositoryInterface::class));
        self::assertInstanceOf(PdoChunkRepository::class, $container->get(ChunkRepositoryInterface::class));
        self::assertInstanceOf(NullRecallClient::class, $container->get(RecallClientInterface::class));
    }

    public function test_a_base_url_swaps_both_the_search_and_the_write_path(): void
    {
        $this->setEnv('NENE_RECALL_BASE_URL', 'http://127.0.0.1:8080');

        $container = $this->container();

        self::assertInstanceOf(RecallChunkSearchRepository::class, $container->get(ChunkSearchRepositoryInterface::class));
        self::assertInstanceOf(IndexedChunkRepository::class, $container->get(ChunkRepositoryInterface::class));
        self::assertInstanceOf(HttpRecallClient::class, $container->get(RecallClientInterface::class));
    }
}

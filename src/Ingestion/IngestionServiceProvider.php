<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use Closure;
use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\DatabaseTransactionManagerInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Http\JsonResponseFactory;
use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Chunk\IndexedChunkRepository;
use NeneCorpus\Chunk\PdoChunkRepository;
use NeneCorpus\Document\DocumentRepositoryInterface;
use NeneCorpus\Document\PdoDocumentRepository;
use NeneCorpus\Http\RuntimeServiceProvider;
use NeneCorpus\Recall\RecallServiceProvider;
use NeneCorpus\Source\PdoSourceRepository;
use NeneCorpus\Source\SourceRepositoryInterface;
use NeneCorpus\Tenancy\Context\RequestScopedOrgIdHolder;
use Psr\Container\ContainerInterface;

final readonly class IngestionServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.ingestion';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                UploadFilenameSanitizer::class,
                static fn (): UploadFilenameSanitizer => new UploadFilenameSanitizer(),
            )
            ->set(
                CsvUploadValidator::class,
                static function (ContainerInterface $container): CsvUploadValidator {
                    $sanitizer = $container->get(UploadFilenameSanitizer::class);

                    if (!$sanitizer instanceof UploadFilenameSanitizer) {
                        throw new LogicException('Upload filename sanitizer service is invalid.');
                    }

                    return new CsvUploadValidator($sanitizer);
                },
            )
            ->set(
                PdfUploadValidator::class,
                static function (ContainerInterface $container): PdfUploadValidator {
                    $sanitizer = $container->get(UploadFilenameSanitizer::class);

                    if (!$sanitizer instanceof UploadFilenameSanitizer) {
                        throw new LogicException('Upload filename sanitizer service is invalid.');
                    }

                    return new PdfUploadValidator($sanitizer);
                },
            )
            ->set(
                TextContentValidator::class,
                static function (ContainerInterface $container): TextContentValidator {
                    $sanitizer = $container->get(UploadFilenameSanitizer::class);

                    if (!$sanitizer instanceof UploadFilenameSanitizer) {
                        throw new LogicException('Upload filename sanitizer service is invalid.');
                    }

                    return new TextContentValidator($sanitizer);
                },
            )
            ->set(
                CsvParser::class,
                static fn (): CsvParser => new CsvParser(),
            )
            ->set(
                PdfTextExtractor::class,
                static fn (): PdfTextExtractor => new PdfTextExtractor(),
            )
            ->set(
                UploadStorage::class,
                static function (ContainerInterface $container): UploadStorage {
                    $projectRoot = $container->get(RuntimeServiceProvider::PROJECT_ROOT);

                    if (!is_string($projectRoot) || $projectRoot === '') {
                        throw new LogicException('Project root service is invalid.');
                    }

                    return new UploadStorage($projectRoot . '/storage/uploads');
                },
            )
            ->set(
                StoredFileReader::class,
                static function (ContainerInterface $container): StoredFileReader {
                    $projectRoot = $container->get(RuntimeServiceProvider::PROJECT_ROOT);

                    if (!is_string($projectRoot) || $projectRoot === '') {
                        throw new LogicException('Project root service is invalid.');
                    }

                    return new StoredFileReader($projectRoot);
                },
            )
            ->set(
                SourceCorpusCleaner::class,
                static function (ContainerInterface $container): SourceCorpusCleaner {
                    return new SourceCorpusCleaner(
                        self::documentRepository($container),
                        self::chunkRepository($container),
                        self::clock($container),
                    );
                },
            )
            ->set(
                PreviewCsvIngestionUseCaseInterface::class,
                static function (ContainerInterface $container): PreviewCsvIngestionUseCaseInterface {
                    $validator = $container->get(CsvUploadValidator::class);
                    $parser = $container->get(CsvParser::class);

                    if (!$validator instanceof CsvUploadValidator) {
                        throw new LogicException('CSV upload validator service is invalid.');
                    }

                    if (!$parser instanceof CsvParser) {
                        throw new LogicException('CSV parser service is invalid.');
                    }

                    return new PreviewCsvIngestionUseCase($validator, $parser);
                },
            )
            ->set(
                PreviewPdfIngestionUseCaseInterface::class,
                static function (ContainerInterface $container): PreviewPdfIngestionUseCaseInterface {
                    $validator = $container->get(PdfUploadValidator::class);
                    $extractor = $container->get(PdfTextExtractor::class);

                    if (!$validator instanceof PdfUploadValidator) {
                        throw new LogicException('PDF upload validator service is invalid.');
                    }

                    if (!$extractor instanceof PdfTextExtractor) {
                        throw new LogicException('PDF text extractor service is invalid.');
                    }

                    return new PreviewPdfIngestionUseCase($validator, $extractor);
                },
            )
            ->set(
                CreateCsvSourceUseCaseInterface::class,
                static function (ContainerInterface $container): CreateCsvSourceUseCaseInterface {
                    return new CreateCsvSourceUseCase(
                        self::sourceRepository($container),
                        self::documentRepository($container),
                        self::chunkRepository($container),
                        self::csvValidator($container),
                        self::csvParser($container),
                        self::uploadStorage($container),
                    );
                },
            )
            ->set(
                CreatePdfSourceUseCaseInterface::class,
                static function (ContainerInterface $container): CreatePdfSourceUseCaseInterface {
                    $transactionManager = $container->get(DatabaseTransactionManagerInterface::class);
                    $queryExecutor = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$transactionManager instanceof DatabaseTransactionManagerInterface) {
                        throw new LogicException('Database transaction manager service is invalid.');
                    }

                    if (!$queryExecutor instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new CreatePdfSourceUseCase(
                        $transactionManager,
                        self::sourceRepositoryFactory($container),
                        self::documentRepositoryFactory($container),
                        self::chunkRepositoryFactory($container),
                        $queryExecutor,
                        self::pdfValidator($container),
                        self::pdfExtractor($container),
                        self::uploadStorage($container),
                    );
                },
            )
            ->set(
                CreateTextSourceUseCaseInterface::class,
                static function (ContainerInterface $container): CreateTextSourceUseCaseInterface {
                    return new CreateTextSourceUseCase(
                        self::sourceRepository($container),
                        self::documentRepository($container),
                        self::chunkRepository($container),
                        self::textContentValidator($container),
                        self::uploadStorage($container),
                    );
                },
            )
            ->set(
                ReindexSourceUseCaseInterface::class,
                static function (ContainerInterface $container): ReindexSourceUseCaseInterface {
                    return new ReindexSourceUseCase(
                        self::sourceRepository($container),
                        self::documentRepository($container),
                        self::chunkRepository($container),
                        self::csvParser($container),
                        self::pdfExtractor($container),
                        self::storedFileReader($container),
                        self::sourceCorpusCleaner($container),
                    );
                },
            )
            ->set(
                PreviewCsvIngestionHandler::class,
                static fn (ContainerInterface $container): PreviewCsvIngestionHandler => new PreviewCsvIngestionHandler(
                    self::previewCsvUseCase($container),
                    self::jsonResponse($container),
                ),
            )
            ->set(
                PreviewPdfIngestionHandler::class,
                static fn (ContainerInterface $container): PreviewPdfIngestionHandler => new PreviewPdfIngestionHandler(
                    self::previewPdfUseCase($container),
                    self::jsonResponse($container),
                ),
            )
            ->set(
                CreateSourceHandler::class,
                static fn (ContainerInterface $container): CreateSourceHandler => new CreateSourceHandler(
                    self::createCsvUseCase($container),
                    self::createPdfUseCase($container),
                    self::createTextUseCase($container),
                    self::jsonResponse($container),
                ),
            )
            ->set(
                ReindexSourceHandler::class,
                static fn (ContainerInterface $container): ReindexSourceHandler => new ReindexSourceHandler(
                    self::reindexSourceUseCase($container),
                    self::jsonResponse($container),
                ),
            )
            ->set(
                CsvIngestionExceptionHandler::class,
                static function (ContainerInterface $container): CsvIngestionExceptionHandler {
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new CsvIngestionExceptionHandler($problemDetails);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): IngestionRouteRegistrar {
                    $previewCsv = $container->get(PreviewCsvIngestionHandler::class);
                    $previewPdf = $container->get(PreviewPdfIngestionHandler::class);
                    $createSource = $container->get(CreateSourceHandler::class);
                    $reindexSource = $container->get(ReindexSourceHandler::class);

                    if (!$previewCsv instanceof PreviewCsvIngestionHandler) {
                        throw new LogicException('Preview CSV ingestion handler service is invalid.');
                    }

                    if (!$previewPdf instanceof PreviewPdfIngestionHandler) {
                        throw new LogicException('Preview PDF ingestion handler service is invalid.');
                    }

                    if (!$createSource instanceof CreateSourceHandler) {
                        throw new LogicException('Create source handler service is invalid.');
                    }

                    if (!$reindexSource instanceof ReindexSourceHandler) {
                        throw new LogicException('Reindex source handler service is invalid.');
                    }

                    return new IngestionRouteRegistrar($previewCsv, $previewPdf, $createSource, $reindexSource);
                },
            );
    }

    private static function sourceRepository(ContainerInterface $container): SourceRepositoryInterface
    {
        $sources = $container->get(SourceRepositoryInterface::class);

        if (!$sources instanceof SourceRepositoryInterface) {
            throw new LogicException('Source repository service is invalid.');
        }

        return $sources;
    }

    private static function documentRepository(ContainerInterface $container): DocumentRepositoryInterface
    {
        $documents = $container->get(DocumentRepositoryInterface::class);

        if (!$documents instanceof DocumentRepositoryInterface) {
            throw new LogicException('Document repository service is invalid.');
        }

        return $documents;
    }

    private static function chunkRepository(ContainerInterface $container): ChunkRepositoryInterface
    {
        $chunks = $container->get(ChunkRepositoryInterface::class);

        if (!$chunks instanceof ChunkRepositoryInterface) {
            throw new LogicException('Chunk repository service is invalid.');
        }

        return $chunks;
    }

    private static function clock(ContainerInterface $container): ClockInterface
    {
        $clock = $container->get(ClockInterface::class);

        if (!$clock instanceof ClockInterface) {
            throw new LogicException('Clock service is invalid.');
        }

        return $clock;
    }

    private static function orgIdHolder(ContainerInterface $container): RequestScopedOrgIdHolder
    {
        $holder = $container->get(RequestScopedOrgIdHolder::class);

        if (!$holder instanceof RequestScopedOrgIdHolder) {
            throw new LogicException('RequestScopedOrgIdHolder service is invalid.');
        }

        return $holder;
    }

    /** @return Closure(DatabaseQueryExecutorInterface): SourceRepositoryInterface */
    private static function sourceRepositoryFactory(ContainerInterface $container): Closure
    {
        $orgIdHolder = self::orgIdHolder($container);
        $clock = self::clock($container);

        return static fn (DatabaseQueryExecutorInterface $executor): SourceRepositoryInterface => new PdoSourceRepository($executor, $orgIdHolder, $clock);
    }

    /** @return Closure(DatabaseQueryExecutorInterface): DocumentRepositoryInterface */
    private static function documentRepositoryFactory(ContainerInterface $container): Closure
    {
        $orgIdHolder = self::orgIdHolder($container);
        $clock = self::clock($container);

        return static fn (DatabaseQueryExecutorInterface $executor): DocumentRepositoryInterface => new PdoDocumentRepository($executor, $orgIdHolder, $clock);
    }

    /** @return Closure(DatabaseQueryExecutorInterface): ChunkRepositoryInterface */
    private static function chunkRepositoryFactory(ContainerInterface $container): Closure
    {
        $orgIdHolder = self::orgIdHolder($container);
        $clock = self::clock($container);

        // The repository built here is transaction-scoped (it is handed the
        // transaction's executor), so the container binding cannot be reused —
        // the Recall decorator has to be applied at this seam as well, or PDF
        // ingestion would write chunks that never reach the index (ADR 0007).
        if (!RecallServiceProvider::config($container)->isConfigured()) {
            return static fn (DatabaseQueryExecutorInterface $executor): ChunkRepositoryInterface => new PdoChunkRepository($executor, $orgIdHolder, $clock);
        }

        $recall = RecallServiceProvider::client($container);

        return static fn (DatabaseQueryExecutorInterface $executor): ChunkRepositoryInterface => new IndexedChunkRepository(
            new PdoChunkRepository($executor, $orgIdHolder, $clock),
            $recall,
            $orgIdHolder,
        );
    }

    private static function csvValidator(ContainerInterface $container): CsvUploadValidator
    {
        $validator = $container->get(CsvUploadValidator::class);

        if (!$validator instanceof CsvUploadValidator) {
            throw new LogicException('CSV upload validator service is invalid.');
        }

        return $validator;
    }

    private static function pdfValidator(ContainerInterface $container): PdfUploadValidator
    {
        $validator = $container->get(PdfUploadValidator::class);

        if (!$validator instanceof PdfUploadValidator) {
            throw new LogicException('PDF upload validator service is invalid.');
        }

        return $validator;
    }

    private static function csvParser(ContainerInterface $container): CsvParser
    {
        $parser = $container->get(CsvParser::class);

        if (!$parser instanceof CsvParser) {
            throw new LogicException('CSV parser service is invalid.');
        }

        return $parser;
    }

    private static function pdfExtractor(ContainerInterface $container): PdfTextExtractor
    {
        $extractor = $container->get(PdfTextExtractor::class);

        if (!$extractor instanceof PdfTextExtractor) {
            throw new LogicException('PDF text extractor service is invalid.');
        }

        return $extractor;
    }

    private static function uploadStorage(ContainerInterface $container): UploadStorage
    {
        $storage = $container->get(UploadStorage::class);

        if (!$storage instanceof UploadStorage) {
            throw new LogicException('Upload storage service is invalid.');
        }

        return $storage;
    }

    private static function previewCsvUseCase(ContainerInterface $container): PreviewCsvIngestionUseCaseInterface
    {
        $useCase = $container->get(PreviewCsvIngestionUseCaseInterface::class);

        if (!$useCase instanceof PreviewCsvIngestionUseCaseInterface) {
            throw new LogicException('Preview CSV ingestion use case service is invalid.');
        }

        return $useCase;
    }

    private static function previewPdfUseCase(ContainerInterface $container): PreviewPdfIngestionUseCaseInterface
    {
        $useCase = $container->get(PreviewPdfIngestionUseCaseInterface::class);

        if (!$useCase instanceof PreviewPdfIngestionUseCaseInterface) {
            throw new LogicException('Preview PDF ingestion use case service is invalid.');
        }

        return $useCase;
    }

    private static function createCsvUseCase(ContainerInterface $container): CreateCsvSourceUseCaseInterface
    {
        $useCase = $container->get(CreateCsvSourceUseCaseInterface::class);

        if (!$useCase instanceof CreateCsvSourceUseCaseInterface) {
            throw new LogicException('Create CSV source use case service is invalid.');
        }

        return $useCase;
    }

    private static function createPdfUseCase(ContainerInterface $container): CreatePdfSourceUseCaseInterface
    {
        $useCase = $container->get(CreatePdfSourceUseCaseInterface::class);

        if (!$useCase instanceof CreatePdfSourceUseCaseInterface) {
            throw new LogicException('Create PDF source use case service is invalid.');
        }

        return $useCase;
    }

    private static function createTextUseCase(ContainerInterface $container): CreateTextSourceUseCaseInterface
    {
        $useCase = $container->get(CreateTextSourceUseCaseInterface::class);

        if (!$useCase instanceof CreateTextSourceUseCaseInterface) {
            throw new LogicException('Create text source use case service is invalid.');
        }

        return $useCase;
    }

    private static function textContentValidator(ContainerInterface $container): TextContentValidator
    {
        $validator = $container->get(TextContentValidator::class);

        if (!$validator instanceof TextContentValidator) {
            throw new LogicException('Text content validator service is invalid.');
        }

        return $validator;
    }

    private static function reindexSourceUseCase(ContainerInterface $container): ReindexSourceUseCaseInterface
    {
        $useCase = $container->get(ReindexSourceUseCaseInterface::class);

        if (!$useCase instanceof ReindexSourceUseCaseInterface) {
            throw new LogicException('Reindex source use case service is invalid.');
        }

        return $useCase;
    }

    private static function storedFileReader(ContainerInterface $container): StoredFileReader
    {
        $reader = $container->get(StoredFileReader::class);

        if (!$reader instanceof StoredFileReader) {
            throw new LogicException('Stored file reader service is invalid.');
        }

        return $reader;
    }

    private static function sourceCorpusCleaner(ContainerInterface $container): SourceCorpusCleaner
    {
        $cleaner = $container->get(SourceCorpusCleaner::class);

        if (!$cleaner instanceof SourceCorpusCleaner) {
            throw new LogicException('Source corpus cleaner service is invalid.');
        }

        return $cleaner;
    }

    private static function jsonResponse(ContainerInterface $container): JsonResponseFactory
    {
        $response = $container->get(JsonResponseFactory::class);

        if (!$response instanceof JsonResponseFactory) {
            throw new LogicException('JSON response factory service is invalid.');
        }

        return $response;
    }
}

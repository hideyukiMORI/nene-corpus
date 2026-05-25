<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Document\DocumentRepositoryInterface;
use NeneCorpus\Http\RuntimeServiceProvider;
use NeneCorpus\Source\SourceRepositoryInterface;
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
                    return new CreatePdfSourceUseCase(
                        self::sourceRepository($container),
                        self::documentRepository($container),
                        self::chunkRepository($container),
                        self::pdfValidator($container),
                        self::pdfExtractor($container),
                        self::uploadStorage($container),
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

                    if (!$previewCsv instanceof PreviewCsvIngestionHandler) {
                        throw new LogicException('Preview CSV ingestion handler service is invalid.');
                    }

                    if (!$previewPdf instanceof PreviewPdfIngestionHandler) {
                        throw new LogicException('Preview PDF ingestion handler service is invalid.');
                    }

                    if (!$createSource instanceof CreateSourceHandler) {
                        throw new LogicException('Create source handler service is invalid.');
                    }

                    return new IngestionRouteRegistrar($previewCsv, $previewPdf, $createSource);
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

    private static function jsonResponse(ContainerInterface $container): JsonResponseFactory
    {
        $response = $container->get(JsonResponseFactory::class);

        if (!$response instanceof JsonResponseFactory) {
            throw new LogicException('JSON response factory service is invalid.');
        }

        return $response;
    }
}

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
                CsvUploadValidator::class,
                static fn (): CsvUploadValidator => new CsvUploadValidator(),
            )
            ->set(
                CsvParser::class,
                static fn (): CsvParser => new CsvParser(),
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
                CreateCsvSourceUseCaseInterface::class,
                static function (ContainerInterface $container): CreateCsvSourceUseCaseInterface {
                    $sources = $container->get(SourceRepositoryInterface::class);
                    $documents = $container->get(DocumentRepositoryInterface::class);
                    $chunks = $container->get(ChunkRepositoryInterface::class);
                    $validator = $container->get(CsvUploadValidator::class);
                    $parser = $container->get(CsvParser::class);
                    $storage = $container->get(UploadStorage::class);

                    if (!$sources instanceof SourceRepositoryInterface) {
                        throw new LogicException('Source repository service is invalid.');
                    }

                    if (!$documents instanceof DocumentRepositoryInterface) {
                        throw new LogicException('Document repository service is invalid.');
                    }

                    if (!$chunks instanceof ChunkRepositoryInterface) {
                        throw new LogicException('Chunk repository service is invalid.');
                    }

                    if (!$validator instanceof CsvUploadValidator) {
                        throw new LogicException('CSV upload validator service is invalid.');
                    }

                    if (!$parser instanceof CsvParser) {
                        throw new LogicException('CSV parser service is invalid.');
                    }

                    if (!$storage instanceof UploadStorage) {
                        throw new LogicException('Upload storage service is invalid.');
                    }

                    return new CreateCsvSourceUseCase(
                        $sources,
                        $documents,
                        $chunks,
                        $validator,
                        $parser,
                        $storage,
                    );
                },
            )
            ->set(
                PreviewCsvIngestionHandler::class,
                static function (ContainerInterface $container): PreviewCsvIngestionHandler {
                    $useCase = $container->get(PreviewCsvIngestionUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof PreviewCsvIngestionUseCaseInterface) {
                        throw new LogicException('Preview CSV ingestion use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new PreviewCsvIngestionHandler($useCase, $response);
                },
            )
            ->set(
                CreateCsvSourceHandler::class,
                static function (ContainerInterface $container): CreateCsvSourceHandler {
                    $useCase = $container->get(CreateCsvSourceUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof CreateCsvSourceUseCaseInterface) {
                        throw new LogicException('Create CSV source use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new CreateCsvSourceHandler($useCase, $response);
                },
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
                    $preview = $container->get(PreviewCsvIngestionHandler::class);
                    $createSource = $container->get(CreateCsvSourceHandler::class);

                    if (!$preview instanceof PreviewCsvIngestionHandler) {
                        throw new LogicException('Preview CSV ingestion handler service is invalid.');
                    }

                    if (!$createSource instanceof CreateCsvSourceHandler) {
                        throw new LogicException('Create CSV source handler service is invalid.');
                    }

                    return new IngestionRouteRegistrar($preview, $createSource);
                },
            );
    }
}

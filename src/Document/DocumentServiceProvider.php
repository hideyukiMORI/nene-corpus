<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Http\RuntimeServiceProvider;
use NeneCorpus\Ingestion\StoredFileWriter;
use NeneCorpus\Source\SourceRepositoryInterface;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseFactoryInterface;

final readonly class DocumentServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.document';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                DocumentRepositoryInterface::class,
                static function (ContainerInterface $container): DocumentRepositoryInterface {
                    $query = $container->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoDocumentRepository($query);
                },
            )
            ->set(
                DocumentContentReader::class,
                static function (ContainerInterface $container): DocumentContentReader {
                    $chunks = $container->get(ChunkRepositoryInterface::class);

                    if (!$chunks instanceof ChunkRepositoryInterface) {
                        throw new LogicException('Chunk repository service is invalid.');
                    }

                    return new DocumentContentReader($chunks);
                },
            )
            ->set(
                DocumentChunkReplacer::class,
                static function (ContainerInterface $container): DocumentChunkReplacer {
                    $chunks = $container->get(ChunkRepositoryInterface::class);

                    if (!$chunks instanceof ChunkRepositoryInterface) {
                        throw new LogicException('Chunk repository service is invalid.');
                    }

                    return new DocumentChunkReplacer($chunks);
                },
            )
            ->set(
                DocumentValidator::class,
                static fn (): DocumentValidator => new DocumentValidator(),
            )
            ->set(
                StoredFileWriter::class,
                static function (ContainerInterface $container): StoredFileWriter {
                    $projectRoot = $container->get(RuntimeServiceProvider::PROJECT_ROOT);

                    if (!is_string($projectRoot) || $projectRoot === '') {
                        throw new LogicException('Project root service is invalid.');
                    }

                    return new StoredFileWriter($projectRoot);
                },
            )
            ->set(
                ListDocumentsUseCaseInterface::class,
                static function (ContainerInterface $container): ListDocumentsUseCaseInterface {
                    return new ListDocumentsUseCase(
                        self::sources($container),
                        self::documents($container),
                    );
                },
            )
            ->set(
                GetDocumentUseCaseInterface::class,
                static function (ContainerInterface $container): GetDocumentUseCaseInterface {
                    return new GetDocumentUseCase(
                        self::documents($container),
                        self::chunks($container),
                        self::contentReader($container),
                    );
                },
            )
            ->set(
                UpdateDocumentUseCaseInterface::class,
                static function (ContainerInterface $container): UpdateDocumentUseCaseInterface {
                    return new UpdateDocumentUseCase(
                        self::documents($container),
                        self::sources($container),
                        self::chunkReplacer($container),
                        self::validator($container),
                        self::storedFileWriter($container),
                    );
                },
            )
            ->set(
                DeleteDocumentUseCaseInterface::class,
                static function (ContainerInterface $container): DeleteDocumentUseCaseInterface {
                    return new DeleteDocumentUseCase(
                        self::documents($container),
                        self::chunks($container),
                    );
                },
            )
            ->set(
                ListDocumentChunksUseCaseInterface::class,
                static function (ContainerInterface $container): ListDocumentChunksUseCaseInterface {
                    return new ListDocumentChunksUseCase(
                        self::documents($container),
                        self::chunks($container),
                    );
                },
            )
            ->set(
                ListDocumentsHandler::class,
                static function (ContainerInterface $container): ListDocumentsHandler {
                    return new ListDocumentsHandler(
                        self::listDocumentsUseCase($container),
                        self::jsonResponse($container),
                    );
                },
            )
            ->set(
                GetDocumentHandler::class,
                static function (ContainerInterface $container): GetDocumentHandler {
                    return new GetDocumentHandler(
                        self::getDocumentUseCase($container),
                        self::jsonResponse($container),
                    );
                },
            )
            ->set(
                ListDocumentChunksHandler::class,
                static function (ContainerInterface $container): ListDocumentChunksHandler {
                    return new ListDocumentChunksHandler(
                        self::listDocumentChunksUseCase($container),
                        self::jsonResponse($container),
                    );
                },
            )
            ->set(
                UpdateDocumentHandler::class,
                static function (ContainerInterface $container): UpdateDocumentHandler {
                    return new UpdateDocumentHandler(
                        self::updateDocumentUseCase($container),
                        self::jsonResponse($container),
                    );
                },
            )
            ->set(
                DeleteDocumentHandler::class,
                static function (ContainerInterface $container): DeleteDocumentHandler {
                    return new DeleteDocumentHandler(
                        self::deleteDocumentUseCase($container),
                        self::responseFactory($container),
                    );
                },
            )
            ->set(
                DocumentNotFoundExceptionHandler::class,
                static function (ContainerInterface $container): DocumentNotFoundExceptionHandler {
                    return new DocumentNotFoundExceptionHandler(self::problemDetails($container));
                },
            )
            ->set(
                DocumentValidationExceptionHandler::class,
                static function (ContainerInterface $container): DocumentValidationExceptionHandler {
                    return new DocumentValidationExceptionHandler(self::problemDetails($container));
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): DocumentRouteRegistrar {
                    return new DocumentRouteRegistrar(
                        self::listDocumentsHandler($container),
                        self::getDocumentHandler($container),
                        self::listDocumentChunksHandler($container),
                        self::updateDocumentHandler($container),
                        self::deleteDocumentHandler($container),
                    );
                },
            );
    }

    private static function documents(ContainerInterface $container): DocumentRepositoryInterface
    {
        $documents = $container->get(DocumentRepositoryInterface::class);

        if (!$documents instanceof DocumentRepositoryInterface) {
            throw new LogicException('Document repository service is invalid.');
        }

        return $documents;
    }

    private static function sources(ContainerInterface $container): SourceRepositoryInterface
    {
        $sources = $container->get(SourceRepositoryInterface::class);

        if (!$sources instanceof SourceRepositoryInterface) {
            throw new LogicException('Source repository service is invalid.');
        }

        return $sources;
    }

    private static function chunks(ContainerInterface $container): ChunkRepositoryInterface
    {
        $chunks = $container->get(ChunkRepositoryInterface::class);

        if (!$chunks instanceof ChunkRepositoryInterface) {
            throw new LogicException('Chunk repository service is invalid.');
        }

        return $chunks;
    }

    private static function contentReader(ContainerInterface $container): DocumentContentReader
    {
        $reader = $container->get(DocumentContentReader::class);

        if (!$reader instanceof DocumentContentReader) {
            throw new LogicException('Document content reader service is invalid.');
        }

        return $reader;
    }

    private static function chunkReplacer(ContainerInterface $container): DocumentChunkReplacer
    {
        $replacer = $container->get(DocumentChunkReplacer::class);

        if (!$replacer instanceof DocumentChunkReplacer) {
            throw new LogicException('Document chunk replacer service is invalid.');
        }

        return $replacer;
    }

    private static function validator(ContainerInterface $container): DocumentValidator
    {
        $validator = $container->get(DocumentValidator::class);

        if (!$validator instanceof DocumentValidator) {
            throw new LogicException('Document validator service is invalid.');
        }

        return $validator;
    }

    private static function storedFileWriter(ContainerInterface $container): StoredFileWriter
    {
        $writer = $container->get(StoredFileWriter::class);

        if (!$writer instanceof StoredFileWriter) {
            throw new LogicException('Stored file writer service is invalid.');
        }

        return $writer;
    }

    private static function listDocumentsUseCase(ContainerInterface $container): ListDocumentsUseCaseInterface
    {
        $useCase = $container->get(ListDocumentsUseCaseInterface::class);

        if (!$useCase instanceof ListDocumentsUseCaseInterface) {
            throw new LogicException('List documents use case service is invalid.');
        }

        return $useCase;
    }

    private static function getDocumentUseCase(ContainerInterface $container): GetDocumentUseCaseInterface
    {
        $useCase = $container->get(GetDocumentUseCaseInterface::class);

        if (!$useCase instanceof GetDocumentUseCaseInterface) {
            throw new LogicException('Get document use case service is invalid.');
        }

        return $useCase;
    }

    private static function updateDocumentUseCase(ContainerInterface $container): UpdateDocumentUseCaseInterface
    {
        $useCase = $container->get(UpdateDocumentUseCaseInterface::class);

        if (!$useCase instanceof UpdateDocumentUseCaseInterface) {
            throw new LogicException('Update document use case service is invalid.');
        }

        return $useCase;
    }

    private static function deleteDocumentUseCase(ContainerInterface $container): DeleteDocumentUseCaseInterface
    {
        $useCase = $container->get(DeleteDocumentUseCaseInterface::class);

        if (!$useCase instanceof DeleteDocumentUseCaseInterface) {
            throw new LogicException('Delete document use case service is invalid.');
        }

        return $useCase;
    }

    private static function listDocumentChunksUseCase(ContainerInterface $container): ListDocumentChunksUseCaseInterface
    {
        $useCase = $container->get(ListDocumentChunksUseCaseInterface::class);

        if (!$useCase instanceof ListDocumentChunksUseCaseInterface) {
            throw new LogicException('List document chunks use case service is invalid.');
        }

        return $useCase;
    }

    private static function listDocumentsHandler(ContainerInterface $container): ListDocumentsHandler
    {
        $handler = $container->get(ListDocumentsHandler::class);

        if (!$handler instanceof ListDocumentsHandler) {
            throw new LogicException('List documents handler service is invalid.');
        }

        return $handler;
    }

    private static function getDocumentHandler(ContainerInterface $container): GetDocumentHandler
    {
        $handler = $container->get(GetDocumentHandler::class);

        if (!$handler instanceof GetDocumentHandler) {
            throw new LogicException('Get document handler service is invalid.');
        }

        return $handler;
    }

    private static function listDocumentChunksHandler(ContainerInterface $container): ListDocumentChunksHandler
    {
        $handler = $container->get(ListDocumentChunksHandler::class);

        if (!$handler instanceof ListDocumentChunksHandler) {
            throw new LogicException('List document chunks handler service is invalid.');
        }

        return $handler;
    }

    private static function updateDocumentHandler(ContainerInterface $container): UpdateDocumentHandler
    {
        $handler = $container->get(UpdateDocumentHandler::class);

        if (!$handler instanceof UpdateDocumentHandler) {
            throw new LogicException('Update document handler service is invalid.');
        }

        return $handler;
    }

    private static function deleteDocumentHandler(ContainerInterface $container): DeleteDocumentHandler
    {
        $handler = $container->get(DeleteDocumentHandler::class);

        if (!$handler instanceof DeleteDocumentHandler) {
            throw new LogicException('Delete document handler service is invalid.');
        }

        return $handler;
    }

    private static function jsonResponse(ContainerInterface $container): JsonResponseFactory
    {
        $response = $container->get(JsonResponseFactory::class);

        if (!$response instanceof JsonResponseFactory) {
            throw new LogicException('JSON response factory service is invalid.');
        }

        return $response;
    }

    private static function responseFactory(ContainerInterface $container): ResponseFactoryInterface
    {
        $responseFactory = $container->get(ResponseFactoryInterface::class);

        if (!$responseFactory instanceof ResponseFactoryInterface) {
            throw new LogicException('Response factory service is invalid.');
        }

        return $responseFactory;
    }

    private static function problemDetails(ContainerInterface $container): ProblemDetailsResponseFactory
    {
        $problemDetails = $container->get(ProblemDetailsResponseFactory::class);

        if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
            throw new LogicException('Problem details response factory service is invalid.');
        }

        return $problemDetails;
    }
}

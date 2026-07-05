<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use Closure;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\DatabaseTransactionManagerInterface;
use NeneCorpus\Chunk\Chunk;
use NeneCorpus\Chunk\ChunkRepositoryInterface;
use NeneCorpus\Document\Document;
use NeneCorpus\Document\DocumentRepositoryInterface;
use NeneCorpus\Source\Source;
use NeneCorpus\Source\SourceRepositoryInterface;
use NeneCorpus\Source\SourceStatus;
use NeneCorpus\Source\SourceType;
use Throwable;

final readonly class CreatePdfSourceUseCase implements CreatePdfSourceUseCaseInterface
{
    /**
     * @param Closure(DatabaseQueryExecutorInterface): SourceRepositoryInterface   $sourceRepositoryFactory
     * @param Closure(DatabaseQueryExecutorInterface): DocumentRepositoryInterface $documentRepositoryFactory
     * @param Closure(DatabaseQueryExecutorInterface): ChunkRepositoryInterface    $chunkRepositoryFactory
     */
    public function __construct(
        private DatabaseTransactionManagerInterface $transactionManager,
        private Closure $sourceRepositoryFactory,
        private Closure $documentRepositoryFactory,
        private Closure $chunkRepositoryFactory,
        private DatabaseQueryExecutorInterface $queryExecutor,
        private PdfUploadValidator $validator,
        private PdfTextExtractor $extractor,
        private UploadStorage $uploadStorage,
    ) {
    }

    public function execute(CreatePdfSourceInput $input): CreateSourceOutput
    {
        $file = $this->validator->decode($input->content, $input->filename);
        $pages = $this->extractor->extractPages($file->bytes);
        $storagePath = $this->uploadStorage->store($file);

        try {
            return $this->transactionManager->transactional(
                function (DatabaseQueryExecutorInterface $executor) use ($input, $file, $pages, $storagePath): CreateSourceOutput {
                    $sources = ($this->sourceRepositoryFactory)($executor);
                    $documents = ($this->documentRepositoryFactory)($executor);
                    $chunks = ($this->chunkRepositoryFactory)($executor);

                    $sourceId = $sources->save(new Source(
                        name: $input->name,
                        sourceType: SourceType::Pdf,
                        status: SourceStatus::Processing,
                        storagePath: $storagePath,
                        originalFilename: $file->originalFilename,
                        mimeType: $file->mimeType,
                        byteSize: $file->byteSize(),
                    ));

                    $documentId = $documents->save(new Document(
                        sourceId: $sourceId,
                        title: $input->name,
                        position: 0,
                        metadataJson: json_encode(['page_count' => count($pages)], JSON_THROW_ON_ERROR),
                    ));

                    foreach ($pages as $index => $page) {
                        $content = $page['text'];
                        $chunks->save(new Chunk(
                            documentId: $documentId,
                            sourceId: $sourceId,
                            content: $content,
                            chunkIndex: $index,
                            pageNumber: $page['page_number'],
                            tokenCount: $this->estimateTokenCount($content),
                        ));
                    }

                    $sources->update(new Source(
                        name: $input->name,
                        sourceType: SourceType::Pdf,
                        status: SourceStatus::Ready,
                        storagePath: $storagePath,
                        originalFilename: $file->originalFilename,
                        mimeType: $file->mimeType,
                        byteSize: $file->byteSize(),
                        id: $sourceId,
                    ));

                    return new CreateSourceOutput(
                        sourceId: $sourceId,
                        name: $input->name,
                        status: SourceStatus::Ready,
                        documentCount: 1,
                        chunkCount: count($pages),
                    );
                },
            );
        } catch (Throwable $exception) {
            // The transaction above has already rolled back in full (source row
            // included), so the failure marker below is a brand new row written
            // through the non-transactional executor — it must survive on its own
            // rather than depend on state the rollback just undid.
            $sources = ($this->sourceRepositoryFactory)($this->queryExecutor);

            $sources->save(new Source(
                name: $input->name,
                sourceType: SourceType::Pdf,
                status: SourceStatus::Failed,
                storagePath: $storagePath,
                originalFilename: $file->originalFilename,
                mimeType: $file->mimeType,
                byteSize: $file->byteSize(),
                errorMessage: $exception->getMessage(),
            ));

            throw $exception;
        }
    }

    private function estimateTokenCount(string $content): int
    {
        return (int) ceil(mb_strlen($content) / 4);
    }
}

<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use NeneCorpus\Source\SourceNotFoundException;
use NeneCorpus\Source\SourceRepositoryInterface;

final readonly class ListDocumentsUseCase implements ListDocumentsUseCaseInterface
{
    public function __construct(
        private SourceRepositoryInterface $sources,
        private DocumentRepositoryInterface $documents,
    ) {
    }

    /**
     * @return array{documents: list<DocumentSummary>, total: int}
     */
    public function execute(ListDocumentsInput $input): array
    {
        if ($this->sources->findById($input->sourceId) === null) {
            throw new SourceNotFoundException($input->sourceId);
        }

        $documents = $this->documents->findSummariesBySourceId(
            $input->sourceId,
            $input->limit,
            $input->offset,
            $input->query,
        );

        $total = $this->documents->countBySourceId($input->sourceId, $input->query);

        return ['documents' => $documents, 'total' => $total];
    }
}

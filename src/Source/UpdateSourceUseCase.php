<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

final readonly class UpdateSourceUseCase implements UpdateSourceUseCaseInterface
{
    public function __construct(
        private SourceRepositoryInterface $sources,
    ) {
    }

    public function execute(UpdateSourceInput $input): UpdateSourceOutput
    {
        $source = $this->sources->findById($input->sourceId);

        if ($source === null) {
            throw new SourceNotFoundException($input->sourceId);
        }

        $note = $input->note !== null && trim($input->note) !== '' ? $input->note : null;

        $this->sources->updateNameAndNote($input->sourceId, $input->name, $note);

        $updated = $this->sources->findById($input->sourceId);

        if ($updated === null) {
            throw new SourceNotFoundException($input->sourceId);
        }

        return new UpdateSourceOutput(
            sourceId: $input->sourceId,
            name: $updated->name,
            note: $updated->note,
            updatedAt: (string) $updated->updatedAt,
        );
    }
}

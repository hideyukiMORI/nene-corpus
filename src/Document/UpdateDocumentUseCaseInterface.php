<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

interface UpdateDocumentUseCaseInterface
{
    public function execute(UpdateDocumentInput $input): DocumentDetail;
}

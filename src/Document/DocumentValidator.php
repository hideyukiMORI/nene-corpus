<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

final readonly class ValidatedDocumentUpdate
{
    public function __construct(
        public string $title,
        public string $content,
    ) {
    }
}

final readonly class DocumentValidator
{
    public function validateUpdate(string $title, string $content): ValidatedDocumentUpdate
    {
        $trimmedTitle = trim($title);
        $trimmedContent = trim($content);

        if ($trimmedTitle === '') {
            throw new DocumentValidationException('Title is required.', 'title');
        }

        if ($trimmedContent === '') {
            throw new DocumentValidationException('Content is required.', 'content');
        }

        return new ValidatedDocumentUpdate(
            title: $trimmedTitle,
            content: $trimmedContent,
        );
    }
}

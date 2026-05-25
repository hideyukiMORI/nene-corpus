<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class CreateSourceHandler
{
    public function __construct(
        private CreateCsvSourceUseCaseInterface $createCsvSource,
        private CreatePdfSourceUseCaseInterface $createPdfSource,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);
        $sourceType = strtolower(trim((string) ($body['source_type'] ?? 'csv')));
        $name = trim((string) ($body['name'] ?? ''));
        $filename = trim((string) ($body['filename'] ?? ''));
        $content = trim((string) ($body['content'] ?? ''));

        $errors = [];

        if ($name === '') {
            $errors[] = new ValidationError('name', 'Name is required.', 'required');
        }

        if ($filename === '') {
            $errors[] = new ValidationError('filename', 'Filename is required.', 'required');
        }

        if ($content === '') {
            $errors[] = new ValidationError('content', 'File content is required.', 'required');
        }

        if (!in_array($sourceType, ['csv', 'pdf'], true)) {
            $errors[] = new ValidationError('source_type', 'Source type must be csv or pdf.', 'invalid');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $output = match ($sourceType) {
            'csv' => $this->createCsv($body, $name, $filename, $content),
            'pdf' => $this->createPdf($name, $filename, $content),
            default => throw new ValidationException([
                new ValidationError('source_type', 'Source type must be csv or pdf.', 'invalid'),
            ]),
        };

        return $this->response->create([
            'source_id' => $output->sourceId,
            'name' => $output->name,
            'status' => $output->status->value,
            'document_count' => $output->documentCount,
            'chunk_count' => $output->chunkCount,
        ], 201);
    }

    /**
     * @param array<string, mixed> $body
     */
    private function createCsv(array $body, string $name, string $filename, string $content): CreateSourceOutput
    {
        $mappingPayload = $body['column_mapping'] ?? null;

        if (!is_array($mappingPayload)) {
            throw new ValidationException([
                new ValidationError('column_mapping', 'Column mapping is required for CSV sources.', 'required'),
            ]);
        }

        return $this->createCsvSource->execute(new CreateCsvSourceInput(
            name: $name,
            filename: $filename,
            content: $content,
            columnMapping: CsvColumnMapping::fromArray($mappingPayload),
        ));
    }

    private function createPdf(string $name, string $filename, string $content): CreateSourceOutput
    {
        return $this->createPdfSource->execute(new CreatePdfSourceInput(
            name: $name,
            filename: $filename,
            content: $content,
        ));
    }
}

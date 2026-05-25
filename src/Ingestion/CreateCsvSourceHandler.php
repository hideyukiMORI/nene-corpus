<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class CreateCsvSourceHandler
{
    public function __construct(
        private CreateCsvSourceUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);
        $name = trim((string) ($body['name'] ?? ''));
        $filename = trim((string) ($body['filename'] ?? ''));
        $content = trim((string) ($body['content'] ?? ''));
        $mappingPayload = $body['column_mapping'] ?? null;

        $errors = [];

        if ($name === '') {
            $errors[] = new ValidationError('name', 'Name is required.', 'required');
        }

        if ($filename === '') {
            $errors[] = new ValidationError('filename', 'Filename is required.', 'required');
        }

        if ($content === '') {
            $errors[] = new ValidationError('content', 'CSV content is required.', 'required');
        }

        if (!is_array($mappingPayload)) {
            $errors[] = new ValidationError('column_mapping', 'Column mapping is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        /** @var array<string, mixed> $mappingPayload */
        $output = $this->useCase->execute(new CreateCsvSourceInput(
            name: $name,
            filename: $filename,
            content: $content,
            columnMapping: CsvColumnMapping::fromArray($mappingPayload),
        ));

        return $this->response->create([
            'source_id' => $output->sourceId,
            'name' => $output->name,
            'status' => $output->status->value,
            'document_count' => $output->documentCount,
            'chunk_count' => $output->chunkCount,
        ], 201);
    }
}

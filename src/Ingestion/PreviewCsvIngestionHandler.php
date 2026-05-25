<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class PreviewCsvIngestionHandler
{
    public function __construct(
        private PreviewCsvIngestionUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);
        $filename = trim((string) ($body['filename'] ?? ''));
        $content = trim((string) ($body['content'] ?? ''));

        $errors = [];

        if ($filename === '') {
            $errors[] = new ValidationError('filename', 'Filename is required.', 'required');
        }

        if ($content === '') {
            $errors[] = new ValidationError('content', 'CSV content is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $output = $this->useCase->execute(new PreviewCsvIngestionInput(
            filename: $filename,
            content: $content,
        ));

        return $this->response->create([
            'headers' => $output->headers,
            'sample_rows' => $output->sampleRows,
            'detected_delimiter' => $output->detectedDelimiter,
            'row_count' => $output->rowCount,
        ]);
    }
}

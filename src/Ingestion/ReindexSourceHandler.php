<?php

declare(strict_types=1);

namespace NeneCorpus\Ingestion;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use NeneCorpus\Source\SourceNotFoundException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ReindexSourceHandler
{
    public function __construct(
        private ReindexSourceUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $sourceId = (int) ($parameters['id'] ?? 0);

        if ($sourceId <= 0) {
            throw new SourceNotFoundException($sourceId);
        }

        $body = JsonRequestBodyParser::parse($request);
        $mappingPayload = $body['column_mapping'] ?? null;
        $columnMappingOverride = is_array($mappingPayload)
            ? CsvColumnMapping::fromArray($mappingPayload)
            : null;

        $output = $this->useCase->execute(new ReindexSourceInput(
            sourceId: $sourceId,
            columnMappingOverride: $columnMappingOverride,
        ));

        return $this->response->create([
            'source_id' => $output->sourceId,
            'name' => $output->name,
            'status' => $output->status->value,
            'document_count' => $output->documentCount,
            'chunk_count' => $output->chunkCount,
        ]);
    }
}

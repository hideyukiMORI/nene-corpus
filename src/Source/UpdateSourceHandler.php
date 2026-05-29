<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class UpdateSourceHandler
{
    public function __construct(
        private UpdateSourceUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        if ($id <= 0) {
            throw new SourceNotFoundException($id);
        }

        $body = JsonRequestBodyParser::parse($request);

        $name = trim((string) ($body['name'] ?? ''));
        $note = isset($body['note']) ? trim((string) $body['note']) : null;

        if ($name === '') {
            throw new ValidationException([
                new ValidationError('name', 'Name is required.', 'required'),
            ]);
        }

        $output = $this->useCase->execute(new UpdateSourceInput(
            sourceId: $id,
            name: $name,
            note: $note,
        ));

        return $this->response->create([
            'source_id'  => $output->sourceId,
            'name'       => $output->name,
            'note'       => $output->note,
            'updated_at' => $output->updatedAt,
        ], 200);
    }
}

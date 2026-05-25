<?php

declare(strict_types=1);

namespace NeneCorpus\Document;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class UpdateDocumentHandler
{
    public function __construct(
        private UpdateDocumentUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);
        $body = JsonRequestBodyParser::parse($request);

        $detail = $this->useCase->execute(new UpdateDocumentInput(
            documentId: $id,
            title: (string) ($body['title'] ?? ''),
            content: (string) ($body['content'] ?? ''),
        ));

        return $this->response->create($detail->toArray());
    }
}

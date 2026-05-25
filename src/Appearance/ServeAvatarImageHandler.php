<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\StreamFactoryInterface;

final readonly class ServeAvatarImageHandler
{
    public function __construct(
        private AvatarImageStorage $storage,
        private ProblemDetailsResponseFactory $problemDetails,
        private ResponseFactoryInterface $responseFactory,
        private StreamFactoryInterface $streamFactory,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $filename = (string) ($parameters['filename'] ?? '');

        if (!AvatarImagePath::isValidStoredFilename($filename)) {
            return $this->notFound($request);
        }

        $absolutePath = $this->storage->resolveAbsolutePath($filename);

        if ($absolutePath === null) {
            return $this->notFound($request);
        }

        $mimeType = mime_content_type($absolutePath);

        if (!is_string($mimeType) || !str_starts_with($mimeType, 'image/')) {
            return $this->notFound($request);
        }

        $bytes = file_get_contents($absolutePath);

        if ($bytes === false) {
            return $this->notFound($request);
        }

        return $this->responseFactory->createResponse(200)
            ->withHeader('Content-Type', $mimeType)
            ->withHeader('Cache-Control', 'public, max-age=86400')
            ->withBody($this->streamFactory->createStream($bytes));
    }

    private function notFound(ServerRequestInterface $request): ResponseInterface
    {
        return $this->problemDetails->create(
            $request,
            'avatar-image-not-found',
            'Not Found',
            404,
            'Avatar image not found.',
        );
    }
}

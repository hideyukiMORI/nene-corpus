<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class UploadAvatarImageHandler
{
    public function __construct(
        private UploadAvatarImageUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = json_decode((string) $request->getBody(), true);

        if (!is_array($body)) {
            throw new ValidationException([
                new ValidationError('body', 'Request body must be valid JSON.', 'invalid'),
            ]);
        }

        $content = trim((string) ($body['content'] ?? ''));
        $filename = trim((string) ($body['filename'] ?? ''));

        if ($filename === '') {
            throw new ValidationException([
                new ValidationError('filename', 'Filename is required.', 'required'),
            ]);
        }

        try {
            $output = $this->useCase->execute(new UploadAvatarImageInput(
                content: $content,
                filename: $filename,
            ));
        } catch (HeroImageUploadException $exception) {
            throw new ValidationException([
                new ValidationError($exception->field, $exception->getMessage(), 'invalid'),
            ]);
        }

        return $this->response->create([
            'image_url' => $output->imageUrl,
        ], 201);
    }
}

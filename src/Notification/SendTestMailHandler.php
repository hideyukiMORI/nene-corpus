<?php

declare(strict_types=1);

namespace NeneCorpus\Notification;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneCorpus\Mail\MailSendException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class SendTestMailHandler
{
    public function __construct(
        private SendTestMailUseCase $useCase,
        private JsonResponseFactory $response,
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body  = JsonRequestBodyParser::parse($request);
        $email = trim((string) ($body['email'] ?? ''));

        if ($email === '') {
            throw new ValidationException([
                new ValidationError('email', 'Email address is required.', 'required'),
            ]);
        }

        try {
            $this->useCase->execute($email);
        } catch (NotificationException $e) {
            return $this->problemDetails->create($request, 'smtp-not-configured', 'SMTP Not Configured', 422, $e->getMessage());
        } catch (MailSendException $e) {
            return $this->problemDetails->create($request, 'mail-send-failed', 'Mail Send Failed', 502, $e->getMessage());
        }

        return $this->response->create(['success' => true]);
    }
}

<?php

declare(strict_types=1);

namespace NeneCorpus\Mail;

use PHPMailer\PHPMailer\Exception as PHPMailerException;
use PHPMailer\PHPMailer\PHPMailer;

final readonly class SmtpMailer implements MailerInterface
{
    public function __construct(
        private SmtpConfig $config,
    ) {
    }

    public function send(MailMessage $message): void
    {
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host       = $this->config->host;
            $mail->Port       = $this->config->port;
            $mail->SMTPAuth   = $this->config->username !== '';
            $mail->Username   = $this->config->username;
            $mail->Password   = $this->config->password;
            $mail->SMTPSecure = match ($this->config->encryption) {
                'ssl'   => PHPMailer::ENCRYPTION_SMTPS,
                'tls'   => PHPMailer::ENCRYPTION_STARTTLS,
                default => '',
            };

            $mail->setFrom($this->config->fromAddress, $this->config->fromName);
            $mail->addAddress($message->to, $message->toName);

            $mail->isHTML(true);
            $mail->CharSet = 'UTF-8';
            $mail->Subject = $message->subject;
            $mail->Body    = $message->htmlBody;
            $mail->AltBody = $message->textBody;

            $mail->send();
        } catch (PHPMailerException $e) {
            throw new MailSendException('Failed to send email: ' . $e->getMessage(), 0, $e);
        }
    }

    public function isConfigured(): bool
    {
        return true;
    }
}

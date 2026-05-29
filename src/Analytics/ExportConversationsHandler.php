<?php

declare(strict_types=1);

namespace NeneCorpus\Analytics;

use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\StreamFactoryInterface;

final readonly class ExportConversationsHandler
{
    public function __construct(
        private ExportConversationsUseCaseInterface $useCase,
        private ResponseFactoryInterface $responseFactory,
        private StreamFactoryInterface $streamFactory,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $query  = $request->getQueryParams();
        $format = isset($query['format']) && $query['format'] === ExportConversationsInput::FORMAT_CONVERSATIONS
            ? ExportConversationsInput::FORMAT_CONVERSATIONS
            : ExportConversationsInput::FORMAT_SESSIONS;

        $from = isset($query['from']) && $query['from'] !== '' ? (string) $query['from'] : null;
        $to   = isset($query['to']) && $query['to'] !== '' ? (string) $query['to'] : null;

        $output = $this->useCase->execute(new ExportConversationsInput($format, $from, $to));

        $csv = $this->buildCsv($output->headers, $output->rows);

        return $this->responseFactory->createResponse(200)
            ->withHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->withHeader('Content-Disposition', 'attachment; filename="' . $output->filename . '"')
            ->withHeader('Cache-Control', 'no-store')
            ->withBody($this->streamFactory->createStream($csv));
    }

    /**
     * @param list<string>       $headers
     * @param list<list<string>> $rows
     */
    private function buildCsv(array $headers, array $rows): string
    {
        $handle = fopen('php://temp', 'r+');

        if ($handle === false) {
            return '';
        }

        // BOM for Excel UTF-8 compatibility
        fwrite($handle, "\xEF\xBB\xBF");

        fputcsv($handle, $headers, ',', '"', '\\');

        foreach ($rows as $row) {
            fputcsv($handle, $row, ',', '"', '\\');
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv !== false ? $csv : '';
    }
}

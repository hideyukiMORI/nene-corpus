<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

final readonly class CorpusSearchToolDefinition
{
    public const NAME = 'search_corpus';

    /**
     * @return array<string, mixed>
     */
    public static function schema(): array
    {
        return [
            'name' => self::NAME,
            'description' => 'Search ingested corpus chunks for passages relevant to the user question.',
            'input_schema' => [
                'type' => 'object',
                'properties' => [
                    'query' => [
                        'type' => 'string',
                        'description' => 'Search query derived from the user question.',
                    ],
                ],
                'required' => ['query'],
            ],
        ];
    }
}

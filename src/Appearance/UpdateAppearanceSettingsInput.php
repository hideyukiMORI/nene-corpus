<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class UpdateAppearanceSettingsInput
{
    /**
     * @param array<string, mixed> $body
     */
    public function __construct(
        public array $body,
    ) {
    }
}

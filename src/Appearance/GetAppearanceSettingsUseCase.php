<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

final readonly class GetAppearanceSettingsUseCase implements GetAppearanceSettingsUseCaseInterface
{
    public function __construct(
        private AppearanceSettingsRepositoryInterface $repository,
    ) {
    }

    public function execute(): AppearanceSettings
    {
        return $this->repository->get();
    }
}

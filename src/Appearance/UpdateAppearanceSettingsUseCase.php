<?php

declare(strict_types=1);

namespace NeneCorpus\Appearance;

use Nene2\Validation\ValidationException;

final readonly class UpdateAppearanceSettingsUseCase implements UpdateAppearanceSettingsUseCaseInterface
{
    public function __construct(
        private AppearanceSettingsRepositoryInterface $repository,
        private AppearanceSettingsValidator $validator,
    ) {
    }

    public function execute(UpdateAppearanceSettingsInput $input): AppearanceSettings
    {
        $errors = $this->validator->validate($input->body);

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $widgetLocale = $input->body['widget_locale'] ?? null;
        $normalizedLocale = is_string($widgetLocale) && $widgetLocale !== '' ? $widgetLocale : null;
        /** @var array<string, mixed> $themeData */
        $themeData = $input->body['theme'];
        /** @var array<string, mixed> $heroData */
        $heroData = is_array($input->body['hero'] ?? null) ? $input->body['hero'] : [];

        $settings = new AppearanceSettings(
            widgetLocale: $normalizedLocale,
            theme: WidgetTheme::fromArray($themeData),
            hero: WidgetHero::fromArray($heroData),
        );

        $this->repository->save($settings);

        return $settings;
    }
}

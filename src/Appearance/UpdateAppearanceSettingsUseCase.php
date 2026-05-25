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
        /** @var array<string, mixed> $body */
        $body = $this->normalizeBody($input->body);
        $errors = $this->validator->validate($body);

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $widgetLocale = $body['widget_locale'] ?? null;
        $normalizedLocale = is_string($widgetLocale) && $widgetLocale !== '' ? $widgetLocale : null;
        /** @var array<string, mixed> $themeData */
        $themeData = $body['theme'];
        /** @var array<string, mixed> $heroData */
        $heroData = is_array($body['hero'] ?? null) ? $body['hero'] : [];
        /** @var array<string, mixed> $chatData */
        $chatData = is_array($body['chat'] ?? null) ? $body['chat'] : [];

        $settings = new AppearanceSettings(
            widgetLocale: $normalizedLocale,
            theme: WidgetTheme::fromArray($themeData),
            hero: WidgetHero::fromArray($heroData),
            chat: WidgetChat::fromArray($chatData),
        );

        $this->repository->save($settings);

        return $settings;
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    private function normalizeBody(array $body): array
    {
        if (!is_array($body['chat'] ?? null)) {
            $body['chat'] = WidgetChat::defaults()->toArray();
        }

        return $body;
    }
}

<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Appearance;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\PdoDatabaseQueryExecutor;
use NeneCorpus\Http\RuntimeContainerFactory;
use NeneCorpus\Tests\Support\AdminHttpTestSupport;
use NeneCorpus\Tests\Support\CorpusSchemaSetup;
use NeneCorpus\Tests\Support\RateLimitSchemaSetup;
use NeneCorpus\Tests\Support\SampleHeroImage;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class AppearanceHttpTest extends TestCase
{
    private const JWT_SECRET = 'test-admin-jwt-secret';

    private string $databasePath;

    protected function setUp(): void
    {
        $this->databasePath = sys_get_temp_dir() . '/nene-corpus-appearance-' . uniqid('', true) . '.sqlite';

        $_ENV['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = self::JWT_SECRET;
        $_ENV['DB_ADAPTER'] = 'sqlite';
        $_ENV['DB_NAME'] = $this->databasePath;
        $_SERVER['DB_ADAPTER'] = 'sqlite';
        $_SERVER['DB_NAME'] = $this->databasePath;

        $container = (new RuntimeContainerFactory())->create();
        $executor = $container->get(DatabaseQueryExecutorInterface::class);
        self::assertInstanceOf(PdoDatabaseQueryExecutor::class, $executor);

        AdminHttpTestSupport::seedTenancy($executor);
        CorpusSchemaSetup::createAdminUsers($executor);
        RateLimitSchemaSetup::create($executor);
        CorpusSchemaSetup::createAppearanceSettings($executor);

        $hash = password_hash('secret-password', PASSWORD_ARGON2ID);
        $now = gmdate('Y-m-d H:i:s');
        $executor->execute(
            'INSERT INTO admin_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
            ['admin@example.com', $hash, $now, $now],
        );
    }

    protected function tearDown(): void
    {
        $_ENV['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
        $_SERVER['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
        unset(
            $_ENV['DB_ADAPTER'],
            $_SERVER['DB_ADAPTER'],
            $_ENV['DB_NAME'],
            $_SERVER['DB_NAME'],
        );

        if (is_file($this->databasePath)) {
            unlink($this->databasePath);
        }
    }

    public function test_public_widget_appearance_returns_defaults(): void
    {
        $response = $this->dispatch('GET', '/widget/appearance');
        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertNull($payload['widget_locale']);
        self::assertSame('#2563eb', $payload['theme']['color_primary']);
        self::assertSame('0.5rem', $payload['theme']['radius_panel']);
        self::assertSame('0.5rem', $payload['theme']['radius_control']);
        self::assertSame('100%', $payload['theme']['max_width']);
        self::assertNull($payload['hero']['title']);
        self::assertTrue($payload['hero']['show_title']);
        self::assertTrue($payload['hero']['show_description']);
        self::assertTrue($payload['hero']['show_cta']);
        self::assertTrue($payload['hero']['show_image']);
        self::assertNull($payload['hero']['image_url']);
        self::assertSame('1rem', $payload['hero']['gap_after']);
        self::assertSame('1rem', $payload['hero']['padding_bottom']);
        self::assertTrue($payload['hero']['show_divider']);
        self::assertSame('silhouette', $payload['chat']['user_avatar_mode']);
        self::assertTrue($payload['chat']['show_assistant_avatar']);
        self::assertSame('32rem', $payload['layout']['max_height']);
        self::assertSame('inline', $payload['layout']['position']);
        self::assertSame(16, $payload['layout']['offset_x']);
        self::assertFalse($payload['layout']['floating_launcher']);
    }

    public function test_admin_can_update_layout_settings(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => self::defaultHeroPayload(),
            'chat' => self::defaultChatPayload(),
            'layout' => [
                ...self::defaultLayoutPayload(),
                'max_height' => '28rem',
                'position' => 'bottom_right',
                'offset_x' => 24,
                'offset_y' => 32,
                'floating_launcher' => true,
            ],
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('28rem', $payload['layout']['max_height']);
        self::assertSame('bottom_right', $payload['layout']['position']);
        self::assertSame(24, $payload['layout']['offset_x']);
        self::assertSame(32, $payload['layout']['offset_y']);
        self::assertTrue($payload['layout']['floating_launcher']);

        $public = $this->decodeJson($this->dispatch('GET', '/widget/appearance'));
        self::assertSame('bottom_right', $public['layout']['position']);
    }

    public function test_update_rejects_floating_launcher_with_inline_position(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => self::defaultHeroPayload(),
            'chat' => self::defaultChatPayload(),
            'layout' => [
                ...self::defaultLayoutPayload(),
                'floating_launcher' => true,
            ],
        ]);

        self::assertSame(422, $response->getStatusCode());
    }

    public function test_admin_can_update_chat_display_settings(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => self::defaultHeroPayload(),
            'chat' => [
                'user_avatar_mode' => 'none',
                'show_assistant_avatar' => false,
            ],
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('none', $payload['chat']['user_avatar_mode']);
        self::assertFalse($payload['chat']['show_assistant_avatar']);

        $public = $this->decodeJson($this->dispatch('GET', '/widget/appearance'));
        self::assertSame('none', $public['chat']['user_avatar_mode']);
        self::assertFalse($public['chat']['show_assistant_avatar']);
    }

    public function test_update_rejects_invalid_user_avatar_mode(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => self::defaultHeroPayload(),
            'chat' => [
                'user_avatar_mode' => 'photo',
                'show_assistant_avatar' => true,
            ],
        ]);

        self::assertSame(422, $response->getStatusCode());
    }

    public function test_admin_can_upload_and_serve_hero_image(): void
    {
        $token = $this->loginToken();
        $factory = new Psr17Factory();

        $upload = $this->handler()->handle(
            $factory->createServerRequest('POST', '/admin/appearance/hero-image')
                ->withHeader('Authorization', 'Bearer ' . $token)
                ->withHeader('Content-Type', 'application/json')
                ->withBody($factory->createStream(json_encode([
                    'filename' => 'hero.png',
                    'content' => SampleHeroImage::base64(),
                ], JSON_THROW_ON_ERROR))),
        );

        $uploadPayload = $this->decodeJson($upload);

        self::assertSame(201, $upload->getStatusCode());
        self::assertIsString($uploadPayload['image_url']);
        self::assertStringStartsWith('/media/hero/', $uploadPayload['image_url']);

        $filename = basename($uploadPayload['image_url']);
        $serve = $this->dispatch('GET', '/media/hero/' . $filename);

        self::assertSame(200, $serve->getStatusCode());
        self::assertStringStartsWith('image/', $serve->getHeaderLine('Content-Type'));
        self::assertSame(SampleHeroImage::bytes(), (string) $serve->getBody());
    }

    public function test_admin_can_save_hero_image_in_appearance_settings(): void
    {
        $token = $this->loginToken();
        $factory = new Psr17Factory();

        $uploadPayload = $this->decodeJson(
            $this->handler()->handle(
                $factory->createServerRequest('POST', '/admin/appearance/hero-image')
                    ->withHeader('Authorization', 'Bearer ' . $token)
                    ->withHeader('Content-Type', 'application/json')
                    ->withBody($factory->createStream(json_encode([
                        'filename' => 'logo.png',
                        'content' => SampleHeroImage::base64(),
                    ], JSON_THROW_ON_ERROR))),
            ),
        );

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => [
                'title' => null,
                'description' => null,
                'cta_label' => null,
                'show_title' => true,
                'show_description' => true,
                'show_cta' => true,
                'show_image' => true,
                'image_url' => $uploadPayload['image_url'],
                'image_alt' => 'Product logo',
            ],
            'chat' => self::defaultChatPayload(),
        ]);

        self::assertSame(200, $response->getStatusCode());

        $public = $this->decodeJson($this->dispatch('GET', '/widget/appearance'));
        self::assertSame($uploadPayload['image_url'], $public['hero']['image_url']);
        self::assertSame('Product logo', $public['hero']['image_alt']);
        self::assertTrue($public['hero']['show_image']);
    }

    public function test_admin_can_upload_and_serve_avatar_image(): void
    {
        $token = $this->loginToken();
        $factory = new Psr17Factory();

        $upload = $this->handler()->handle(
            $factory->createServerRequest('POST', '/admin/appearance/avatar-image')
                ->withHeader('Authorization', 'Bearer ' . $token)
                ->withHeader('Content-Type', 'application/json')
                ->withBody($factory->createStream(json_encode([
                    'filename' => 'avatar.png',
                    'content' => SampleHeroImage::base64(),
                ], JSON_THROW_ON_ERROR))),
        );

        $uploadPayload = $this->decodeJson($upload);

        self::assertSame(201, $upload->getStatusCode());
        self::assertIsString($uploadPayload['image_url']);
        self::assertStringStartsWith('/media/avatar/', $uploadPayload['image_url']);

        $filename = basename($uploadPayload['image_url']);
        $serve = $this->dispatch('GET', '/media/avatar/' . $filename);

        self::assertSame(200, $serve->getStatusCode());
        self::assertStringStartsWith('image/', $serve->getHeaderLine('Content-Type'));
        self::assertSame(SampleHeroImage::bytes(), (string) $serve->getBody());
    }

    public function test_admin_can_save_avatar_image_in_chat_settings(): void
    {
        $token = $this->loginToken();
        $factory = new Psr17Factory();

        $uploadPayload = $this->decodeJson(
            $this->handler()->handle(
                $factory->createServerRequest('POST', '/admin/appearance/avatar-image')
                    ->withHeader('Authorization', 'Bearer ' . $token)
                    ->withHeader('Content-Type', 'application/json')
                    ->withBody($factory->createStream(json_encode([
                        'filename' => 'bot.png',
                        'content' => SampleHeroImage::base64(),
                    ], JSON_THROW_ON_ERROR))),
            ),
        );

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => self::defaultHeroPayload(),
            'chat' => [
                ...self::defaultChatPayload(),
                'assistant_avatar_url' => $uploadPayload['image_url'],
                'assistant_avatar_alt' => 'Support bot',
            ],
        ]);

        self::assertSame(200, $response->getStatusCode());

        $public = $this->decodeJson($this->dispatch('GET', '/widget/appearance'));
        self::assertSame($uploadPayload['image_url'], $public['chat']['assistant_avatar_url']);
        self::assertSame('Support bot', $public['chat']['assistant_avatar_alt']);
    }

    public function test_upload_rejects_invalid_image(): void
    {
        $token = $this->loginToken();
        $factory = new Psr17Factory();

        $response = $this->handler()->handle(
            $factory->createServerRequest('POST', '/admin/appearance/hero-image')
                ->withHeader('Authorization', 'Bearer ' . $token)
                ->withHeader('Content-Type', 'application/json')
                ->withBody($factory->createStream(json_encode([
                    'filename' => 'notes.txt',
                    'content' => base64_encode('not-an-image'),
                ], JSON_THROW_ON_ERROR))),
        );

        self::assertSame(422, $response->getStatusCode());
    }

    public function test_admin_can_update_appearance(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => 'ja',
            'theme' => [
                'color_primary' => '#dc2626',
                'color_surface' => '#ffffff',
                'color_text' => '#111827',
                'radius_md' => '0.75rem',
                'max_width' => '480px',
            ],
            'hero' => [
                'title' => '商品について質問',
                'description' => 'マニュアルから回答します。',
                'cta_label' => '質問する',
                'show_title' => true,
                'show_description' => true,
                'show_cta' => false,
                'show_image' => true,
                'image_url' => null,
                'image_alt' => null,
            ],
            'chat' => self::defaultChatPayload(),
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('ja', $payload['widget_locale']);
        self::assertSame('#dc2626', $payload['theme']['color_primary']);
        self::assertSame('0.75rem', $payload['theme']['radius_panel']);
        self::assertSame('0.75rem', $payload['theme']['radius_control']);

        $public = $this->decodeJson($this->dispatch('GET', '/widget/appearance'));
        self::assertSame('ja', $public['widget_locale']);
        self::assertSame('#dc2626', $public['theme']['color_primary']);
        self::assertSame('0.75rem', $public['theme']['radius_panel']);
        self::assertSame('480px', $public['theme']['max_width']);
        self::assertSame('商品について質問', $public['hero']['title']);
        self::assertFalse($public['hero']['show_cta']);
    }

    public function test_update_accepts_legacy_radius_md(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => [
                'color_primary' => '#2563eb',
                'color_surface' => '#ffffff',
                'color_text' => '#1f2937',
                'radius_md' => '1rem',
                'max_width' => '100%',
            ],
            'hero' => self::defaultHeroPayload(),
            'chat' => self::defaultChatPayload(),
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('1rem', $payload['theme']['radius_panel']);
        self::assertSame('1rem', $payload['theme']['radius_control']);
    }

    public function test_admin_can_update_hero_spacing(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => [
                ...self::defaultHeroPayload(),
                'gap_after' => '0px',
                'padding_bottom' => '0.5rem',
                'show_divider' => false,
            ],
            'chat' => self::defaultChatPayload(),
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('0px', $payload['hero']['gap_after']);
        self::assertSame('0.5rem', $payload['hero']['padding_bottom']);
        self::assertFalse($payload['hero']['show_divider']);
    }

    public function test_update_rejects_invalid_hero_show_flag(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => [
                'title' => null,
                'description' => null,
                'cta_label' => null,
                'show_title' => 'yes',
                'show_description' => true,
                'show_cta' => true,
                'show_image' => true,
                'image_url' => null,
                'image_alt' => null,
            ],
            'chat' => self::defaultChatPayload(),
        ]);

        self::assertSame(422, $response->getStatusCode());
    }

    public function test_update_accepts_string_boolean_flags(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => [
                ...self::defaultHeroPayload(),
                'show_title' => 'true',
                'show_description' => 'false',
                'show_cta' => '1',
                'show_image' => '0',
            ],
            'chat' => [
                'user_avatar_mode' => 'silhouette',
                'show_assistant_avatar' => 'false',
            ],
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertTrue($payload['hero']['show_title']);
        self::assertFalse($payload['hero']['show_description']);
        self::assertTrue($payload['hero']['show_cta']);
        self::assertFalse($payload['hero']['show_image']);
        self::assertFalse($payload['chat']['show_assistant_avatar']);
    }

    public function test_update_defaults_chat_when_missing(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => self::defaultHeroPayload(),
        ]);

        $payload = $this->decodeJson($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('silhouette', $payload['chat']['user_avatar_mode']);
        self::assertTrue($payload['chat']['show_assistant_avatar']);
    }

    public function test_update_rejects_invalid_color(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => [
                'color_primary' => 'red',
                'color_surface' => '#ffffff',
                'color_text' => '#111827',
                'radius_panel' => '0.5rem',
                'radius_control' => '0.5rem',
                'max_width' => '100%',
            ],
            'hero' => self::defaultHeroPayload(),
            'chat' => self::defaultChatPayload(),
        ]);

        self::assertSame(422, $response->getStatusCode());
    }

    public function test_admin_can_save_and_retrieve_custom_css(): void
    {
        $token = $this->loginToken();

        $css = '.nene-corpus-root { --test: 1; }';

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => self::defaultHeroPayload(),
            'chat' => self::defaultChatPayload(),
            'layout' => self::defaultLayoutPayload(),
            'custom_css' => $css,
        ]);

        self::assertSame(200, $response->getStatusCode());

        $payload = $this->decodeJson($response);

        self::assertSame($css, $payload['custom_css']);

        $public = $this->decodeJson($this->dispatch('GET', '/widget/appearance'));

        self::assertSame($css, $public['custom_css']);
    }

    public function test_update_rejects_forbidden_css_pattern(): void
    {
        $token = $this->loginToken();

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => self::defaultHeroPayload(),
            'chat' => self::defaultChatPayload(),
            'layout' => self::defaultLayoutPayload(),
            'custom_css' => '.x { background: url(https://evil.example/img.png); }',
        ]);

        self::assertSame(422, $response->getStatusCode());
    }

    public function test_custom_css_null_clears_value(): void
    {
        $token = $this->loginToken();

        $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => self::defaultHeroPayload(),
            'chat' => self::defaultChatPayload(),
            'layout' => self::defaultLayoutPayload(),
            'custom_css' => '.nene-corpus-root { color: red; }',
        ]);

        $response = $this->authorizedPut($token, [
            'widget_locale' => null,
            'theme' => self::defaultThemePayload(),
            'hero' => self::defaultHeroPayload(),
            'chat' => self::defaultChatPayload(),
            'layout' => self::defaultLayoutPayload(),
            'custom_css' => null,
        ]);

        self::assertSame(200, $response->getStatusCode());

        $payload = $this->decodeJson($response);

        self::assertNull($payload['custom_css']);
    }

    /**
     * @return array<string, mixed>
     */
    private static function defaultThemePayload(): array
    {
        return [
            'color_primary' => '#2563eb',
            'color_surface' => '#ffffff',
            'color_text' => '#1f2937',
            'radius_panel' => '0.5rem',
            'radius_control' => '0.5rem',
            'max_width' => '100%',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function defaultHeroPayload(): array
    {
        return [
            'title' => null,
            'description' => null,
            'cta_label' => null,
            'show_title' => true,
            'show_description' => true,
            'show_cta' => true,
            'show_image' => true,
            'image_url' => null,
            'image_alt' => null,
            'gap_after' => '1rem',
            'padding_bottom' => '1rem',
            'show_divider' => true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function defaultChatPayload(): array
    {
        return [
            'user_avatar_mode' => 'silhouette',
            'show_assistant_avatar' => true,
            'assistant_avatar_url' => null,
            'assistant_avatar_alt' => null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function defaultLayoutPayload(): array
    {
        return [
            'max_height' => '32rem',
            'position' => 'inline',
            'offset_x' => 16,
            'offset_y' => 16,
            'floating_launcher' => false,
        ];
    }

    private function loginToken(): string
    {
        $factory = new Psr17Factory();
        $handler = $this->handler();
        $response = $handler->handle(
            $factory->createServerRequest('POST', '/admin/auth/login')
                ->withHeader('Content-Type', 'application/json')
                ->withBody($factory->createStream(json_encode([
                    'email' => 'admin@example.com',
                    'password' => 'secret-password',
                ], JSON_THROW_ON_ERROR))),
        );

        $payload = $this->decodeJson($response);

        return (string) $payload['access_token'];
    }

    /**
     * @param array<string, mixed> $body
     */
    private function authorizedPut(string $token, array $body): ResponseInterface
    {
        $factory = new Psr17Factory();

        return $this->handler()->handle(
            $factory->createServerRequest('PUT', '/admin/appearance')
                ->withHeader('Authorization', 'Bearer ' . $token)
                ->withHeader('Content-Type', 'application/json')
                ->withBody($factory->createStream(json_encode($body, JSON_THROW_ON_ERROR))),
        );
    }

    private function dispatch(string $method, string $path): ResponseInterface
    {
        $factory = new Psr17Factory();

        return $this->handler()->handle($factory->createServerRequest($method, $path));
    }

    private function handler(): RequestHandlerInterface
    {
        $container = (new RuntimeContainerFactory())->create();

        return $container->get(RequestHandlerInterface::class);
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(ResponseInterface $response): array
    {
        $decoded = json_decode((string) $response->getBody(), true);

        return is_array($decoded) ? $decoded : [];
    }
}

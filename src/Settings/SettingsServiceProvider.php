<?php

declare(strict_types=1);

namespace NeneCorpus\Settings;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use NeneCorpus\Config\EnvironmentVariableUpdater;
use NeneCorpus\Install\EnvFileWriter;
use NeneCorpus\Llm\AnthropicConnectionTester;
use NeneCorpus\Llm\AnthropicConnectionTesterInterface;
use NeneCorpus\Llm\StubAnthropicConnectionTester;
use Psr\Container\ContainerInterface;

final readonly class SettingsServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRAR = 'nene-corpus.route_registrar.settings';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                EnvironmentVariableUpdater::class,
                static fn (): EnvironmentVariableUpdater => new EnvironmentVariableUpdater(),
            )
            ->set(
                AnthropicConnectionTesterInterface::class,
                static function (): AnthropicConnectionTesterInterface {
                    if (($_ENV['NENE_CORPUS_STUB_LLM_TEST'] ?? $_SERVER['NENE_CORPUS_STUB_LLM_TEST'] ?? '') === '1') {
                        return new StubAnthropicConnectionTester();
                    }

                    return new AnthropicConnectionTester();
                },
            )
            ->set(
                LlmSettingsValidator::class,
                static fn (): LlmSettingsValidator => new LlmSettingsValidator(),
            )
            ->set(
                GetLlmSettingsUseCaseInterface::class,
                static fn (): GetLlmSettingsUseCaseInterface => new GetLlmSettingsUseCase(),
            )
            ->set(
                UpdateLlmSettingsUseCaseInterface::class,
                static function (ContainerInterface $container): UpdateLlmSettingsUseCaseInterface {
                    $envWriter = $container->get(EnvFileWriter::class);
                    $environmentUpdater = $container->get(EnvironmentVariableUpdater::class);
                    $validator = $container->get(LlmSettingsValidator::class);
                    $tester = $container->get(AnthropicConnectionTesterInterface::class);

                    if (!$envWriter instanceof EnvFileWriter) {
                        throw new LogicException('Env file writer service is invalid.');
                    }

                    if (!$environmentUpdater instanceof EnvironmentVariableUpdater) {
                        throw new LogicException('Environment variable updater service is invalid.');
                    }

                    if (!$validator instanceof LlmSettingsValidator) {
                        throw new LogicException('LLM settings validator service is invalid.');
                    }

                    if (!$tester instanceof AnthropicConnectionTesterInterface) {
                        throw new LogicException('Anthropic connection tester service is invalid.');
                    }

                    return new UpdateLlmSettingsUseCase($envWriter, $environmentUpdater, $validator, $tester);
                },
            )
            ->set(
                TestLlmConnectionUseCaseInterface::class,
                static function (ContainerInterface $container): TestLlmConnectionUseCaseInterface {
                    $validator = $container->get(LlmSettingsValidator::class);
                    $tester = $container->get(AnthropicConnectionTesterInterface::class);

                    if (!$validator instanceof LlmSettingsValidator) {
                        throw new LogicException('LLM settings validator service is invalid.');
                    }

                    if (!$tester instanceof AnthropicConnectionTesterInterface) {
                        throw new LogicException('Anthropic connection tester service is invalid.');
                    }

                    return new TestLlmConnectionUseCase($validator, $tester);
                },
            )
            ->set(
                GetLlmSettingsHandler::class,
                static function (ContainerInterface $container): GetLlmSettingsHandler {
                    $useCase = $container->get(GetLlmSettingsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof GetLlmSettingsUseCaseInterface) {
                        throw new LogicException('Get LLM settings use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetLlmSettingsHandler($useCase, $response);
                },
            )
            ->set(
                UpdateLlmSettingsHandler::class,
                static function (ContainerInterface $container): UpdateLlmSettingsHandler {
                    $useCase = $container->get(UpdateLlmSettingsUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof UpdateLlmSettingsUseCaseInterface) {
                        throw new LogicException('Update LLM settings use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateLlmSettingsHandler($useCase, $response);
                },
            )
            ->set(
                TestLlmConnectionHandler::class,
                static function (ContainerInterface $container): TestLlmConnectionHandler {
                    $useCase = $container->get(TestLlmConnectionUseCaseInterface::class);
                    $response = $container->get(JsonResponseFactory::class);

                    if (!$useCase instanceof TestLlmConnectionUseCaseInterface) {
                        throw new LogicException('Test LLM connection use case service is invalid.');
                    }

                    if (!$response instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new TestLlmConnectionHandler($useCase, $response);
                },
            )
            ->set(
                self::ROUTE_REGISTRAR,
                static function (ContainerInterface $container): LlmSettingsRouteRegistrar {
                    $get = $container->get(GetLlmSettingsHandler::class);
                    $update = $container->get(UpdateLlmSettingsHandler::class);
                    $test = $container->get(TestLlmConnectionHandler::class);

                    if (!$get instanceof GetLlmSettingsHandler) {
                        throw new LogicException('Get LLM settings handler service is invalid.');
                    }

                    if (!$update instanceof UpdateLlmSettingsHandler) {
                        throw new LogicException('Update LLM settings handler service is invalid.');
                    }

                    if (!$test instanceof TestLlmConnectionHandler) {
                        throw new LogicException('Test LLM connection handler service is invalid.');
                    }

                    return new LlmSettingsRouteRegistrar($get, $update, $test);
                },
            );
    }
}

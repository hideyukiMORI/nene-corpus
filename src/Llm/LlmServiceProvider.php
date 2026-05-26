<?php

declare(strict_types=1);

namespace NeneCorpus\Llm;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use NeneCorpus\ChatSettings\ChatSettingsRepositoryInterface;
use NeneCorpus\Search\SearchChunksUseCaseInterface;
use Psr\Container\ContainerInterface;

final readonly class LlmServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                AnthropicConfig::class,
                static fn (ContainerInterface $container): AnthropicConfig => AnthropicConfig::fromEnvironment(),
            )
            ->set(
                CorpusSearchToolHandler::class,
                static function (ContainerInterface $container): CorpusSearchToolHandler {
                    $search = $container->get(SearchChunksUseCaseInterface::class);

                    if (!$search instanceof SearchChunksUseCaseInterface) {
                        throw new LogicException('Search chunks use case service is invalid.');
                    }

                    return new CorpusSearchToolHandler($search);
                },
            )
            ->set(
                ClaudeMessagesClientInterface::class,
                static function (ContainerInterface $container): ClaudeMessagesClientInterface {
                    $config = $container->get(AnthropicConfig::class);

                    if (!$config instanceof AnthropicConfig) {
                        throw new LogicException('Anthropic config service is invalid.');
                    }

                    if ($config->isConfigured()) {
                        return new HttpClaudeMessagesClient($config);
                    }

                    return new StubClaudeMessagesClient();
                },
            )
            ->set(
                GenerateChatReplyUseCaseInterface::class,
                static function (ContainerInterface $container): GenerateChatReplyUseCaseInterface {
                    $client = $container->get(ClaudeMessagesClientInterface::class);
                    $searchTool = $container->get(CorpusSearchToolHandler::class);
                    $chatSettings = $container->get(ChatSettingsRepositoryInterface::class);

                    if (!$client instanceof ClaudeMessagesClientInterface) {
                        throw new LogicException('Claude messages client service is invalid.');
                    }

                    if (!$searchTool instanceof CorpusSearchToolHandler) {
                        throw new LogicException('Corpus search tool handler service is invalid.');
                    }

                    if (!$chatSettings instanceof ChatSettingsRepositoryInterface) {
                        throw new LogicException('Chat settings repository service is invalid.');
                    }

                    return new GenerateChatReplyUseCase($client, $searchTool, $chatSettings);
                },
            );
    }
}

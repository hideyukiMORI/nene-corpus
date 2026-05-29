<?php

declare(strict_types=1);

namespace NeneCorpus\Tenancy\Context;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use NeneCorpus\Organization\OrganizationRepositoryInterface;
use NeneCorpus\SystemConfig\SystemConfigRepositoryInterface;
use NeneCorpus\Tenancy\Resolution\OrgResolverMiddleware;
use Psr\Container\ContainerInterface;

final readonly class TenancyServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        // RequestScopedOrgIdHolder は singleton として登録
        // OrgResolverMiddleware がリクエスト毎に setId() / clear() する
        $builder
            ->set(
                RequestScopedOrgIdHolder::class,
                static fn (ContainerInterface $c): RequestScopedOrgIdHolder => new RequestScopedOrgIdHolder(),
            )
            ->set(
                OrgResolverMiddleware::class,
                static function (ContainerInterface $c): OrgResolverMiddleware {
                    $holder       = $c->get(RequestScopedOrgIdHolder::class);
                    $organizations = $c->get(OrganizationRepositoryInterface::class);
                    $systemConfig  = $c->get(SystemConfigRepositoryInterface::class);
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$holder instanceof RequestScopedOrgIdHolder) {
                        throw new LogicException('RequestScopedOrgIdHolder service is invalid.');
                    }

                    if (!$organizations instanceof OrganizationRepositoryInterface) {
                        throw new LogicException('Organization repository service is invalid.');
                    }

                    if (!$systemConfig instanceof SystemConfigRepositoryInterface) {
                        throw new LogicException('System config repository service is invalid.');
                    }

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new OrgResolverMiddleware($holder, $organizations, $systemConfig, $problemDetails);
                },
            );
    }
}

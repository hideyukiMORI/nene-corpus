<?php

declare(strict_types=1);

namespace NeneCorpus\Install;

final readonly class GetInstallStatusUseCase
{
    public function __construct(
        private InstallLock $installLock,
        private InstallPathResolver $pathResolver,
    ) {
    }

    /**
     * @return array{
     *     installed: bool,
     *     base_path: string,
     *     paths: array{
     *         base_path: string,
     *         widget_script_src: string,
     *         widget_css_href: string,
     *         api_base: string
     *     }
     * }
     */
    public function execute(): array
    {
        $paths = $this->pathResolver->publicPaths();

        return [
            'installed' => $this->installLock->isInstalled(),
            'base_path' => $paths['base_path'],
            'paths' => $paths,
        ];
    }
}

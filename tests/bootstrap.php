<?php

declare(strict_types=1);

$loader = require dirname(__DIR__) . '/vendor/autoload.php';

// When running in a git worktree, the symlinked vendor autoloader resolves src/tests
// to the main repo path. Override classmap and PSR-4 paths so worktree files take priority.
$worktreeRoot = dirname(__DIR__);
$mainRepoRoot = realpath(dirname($worktreeRoot, 4)); // nene-corpus/.claude/worktrees/agent-X -> nene-corpus
if ($mainRepoRoot !== false && $mainRepoRoot !== $worktreeRoot) {
    $loader->addPsr4('NeneCorpus\\', [$worktreeRoot . '/src'], true);
    $loader->addPsr4('NeneCorpus\\Tests\\', [$worktreeRoot . '/tests'], true);

    // Override classmap entries for worktree files so they take priority over the main repo.
    // The classmap is checked before PSR-4 in Composer's ClassLoader::findFile().
    $worktreeClassMap = [];
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($worktreeRoot . '/src')) as $file) {
        if ($file->getExtension() !== 'php') {
            continue;
        }
        $relativePath = str_replace($worktreeRoot . '/src/', '', $file->getPathname());
        $classNamespace = str_replace('/', '\\', substr($relativePath, 0, -4));
        $worktreeClassMap['NeneCorpus\\' . $classNamespace] = $file->getPathname();
    }
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($worktreeRoot . '/tests')) as $file) {
        if ($file->getExtension() !== 'php') {
            continue;
        }
        $relativePath = str_replace($worktreeRoot . '/tests/', '', $file->getPathname());
        $classNamespace = str_replace('/', '\\', substr($relativePath, 0, -4));
        $worktreeClassMap['NeneCorpus\\Tests\\' . $classNamespace] = $file->getPathname();
    }
    $loader->addClassMap($worktreeClassMap);
}

if (!isset($_ENV['NENE2_LOCAL_JWT_SECRET']) && !isset($_SERVER['NENE2_LOCAL_JWT_SECRET'])) {
    $_ENV['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
    $_SERVER['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
}

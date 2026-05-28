<?php

declare(strict_types=1);

$loader = require dirname(__DIR__) . '/vendor/autoload.php';

// When running in a git worktree, the symlinked vendor autoloader resolves src/tests
// to the main repo path. Add the worktree paths so new modules are found.
$worktreeRoot = dirname(__DIR__);
$mainRepoRoot = realpath(dirname($worktreeRoot, 4)); // nene-corpus/.claude/worktrees/agent-X -> nene-corpus
if ($mainRepoRoot !== false && $mainRepoRoot !== $worktreeRoot) {
    $loader->addPsr4('NeneCorpus\\', [$worktreeRoot . '/src']);
    $loader->addPsr4('NeneCorpus\\Tests\\', [$worktreeRoot . '/tests']);
}

if (!isset($_ENV['NENE2_LOCAL_JWT_SECRET']) && !isset($_SERVER['NENE2_LOCAL_JWT_SECRET'])) {
    $_ENV['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
    $_SERVER['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
}

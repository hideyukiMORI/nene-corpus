<?php

declare(strict_types=1);

$loader = require dirname(__DIR__) . '/vendor/autoload.php';

// When running in a git worktree, the symlinked vendor autoloader resolves src/tests
// to the main repo path. Prepend the worktree paths so modified classes take priority.
$worktreeRoot = dirname(__DIR__);
$mainRepoRoot = realpath(dirname($worktreeRoot, 4)); // nene-corpus/.claude/worktrees/agent-X -> nene-corpus
if ($mainRepoRoot !== false && $mainRepoRoot !== $worktreeRoot) {
    $existingSrc   = $loader->getPrefixesPsr4()['NeneCorpus\\']       ?? [];
    $existingTests = $loader->getPrefixesPsr4()['NeneCorpus\\Tests\\'] ?? [];
    $loader->setPsr4('NeneCorpus\\', array_merge([$worktreeRoot . '/src'], $existingSrc));
    $loader->setPsr4('NeneCorpus\\Tests\\', array_merge([$worktreeRoot . '/tests'], $existingTests));
}

if (!isset($_ENV['NENE2_LOCAL_JWT_SECRET']) && !isset($_SERVER['NENE2_LOCAL_JWT_SECRET'])) {
    $_ENV['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
    $_SERVER['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
}

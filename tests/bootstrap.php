<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

if (!isset($_ENV['NENE2_LOCAL_JWT_SECRET']) && !isset($_SERVER['NENE2_LOCAL_JWT_SECRET'])) {
    $_ENV['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
    $_SERVER['NENE2_LOCAL_JWT_SECRET'] = 'phpunit-default-jwt-secret';
}

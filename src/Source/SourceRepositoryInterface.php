<?php

declare(strict_types=1);

namespace NeneCorpus\Source;

interface SourceRepositoryInterface
{
    public function findById(int $id): ?Source;

    /** @return list<Source> */
    public function findAll(int $limit, int $offset): array;

    public function save(Source $source): int;

    public function update(Source $source): void;

    public function softDelete(int $id, string $deletedAt): void;
}

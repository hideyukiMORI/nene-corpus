<?php

declare(strict_types=1);

namespace NeneCorpus\Tests\Unit\Upstream;

use NeneCorpus\Upstream\NeneRecordsEntity;
use PHPUnit\Framework\TestCase;

final class NeneRecordsEntityTest extends TestCase
{
    public function test_from_array_maps_fields(): void
    {
        $entity = NeneRecordsEntity::fromArray([
            'id' => 42,
            'entity_type_id' => 3,
            'slug' => 'test-post',
            'status' => 'published',
            'meta_title' => 'Test Post',
            'meta_description' => 'A description.',
            'published_at' => '2026-05-30T00:00:00Z',
        ]);

        self::assertSame(42, $entity->id);
        self::assertSame(3, $entity->entityTypeId);
        self::assertSame('test-post', $entity->slug);
        self::assertSame('published', $entity->status);
        self::assertSame('Test Post', $entity->metaTitle);
        self::assertSame('A description.', $entity->metaDescription);
        self::assertSame('2026-05-30T00:00:00Z', $entity->publishedAt);
    }

    public function test_from_array_handles_null_fields(): void
    {
        $entity = NeneRecordsEntity::fromArray([
            'id' => 1,
            'entity_type_id' => 1,
            'slug' => null,
            'status' => 'draft',
            'meta_title' => null,
            'meta_description' => null,
            'published_at' => null,
        ]);

        self::assertNull($entity->slug);
        self::assertNull($entity->metaTitle);
        self::assertNull($entity->metaDescription);
        self::assertNull($entity->publishedAt);
    }

    public function test_label_returns_meta_title_when_present(): void
    {
        $entity = NeneRecordsEntity::fromArray([
            'id' => 1, 'entity_type_id' => 1,
            'slug' => 'my-slug', 'status' => 'published',
            'meta_title' => 'My Title',
            'meta_description' => null, 'published_at' => null,
        ]);

        self::assertSame('My Title', $entity->label());
    }

    public function test_label_falls_back_to_slug(): void
    {
        $entity = NeneRecordsEntity::fromArray([
            'id' => 5, 'entity_type_id' => 1,
            'slug' => 'my-slug', 'status' => 'published',
            'meta_title' => null,
            'meta_description' => null, 'published_at' => null,
        ]);

        self::assertSame('my-slug', $entity->label());
    }

    public function test_label_falls_back_to_id(): void
    {
        $entity = NeneRecordsEntity::fromArray([
            'id' => 99, 'entity_type_id' => 1,
            'slug' => null, 'status' => 'draft',
            'meta_title' => null,
            'meta_description' => null, 'published_at' => null,
        ]);

        self::assertSame('entity:99', $entity->label());
    }
}

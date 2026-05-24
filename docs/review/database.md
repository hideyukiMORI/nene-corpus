# Database Self-Review

Use for migrations, schema docs, repositories, and soft-delete behavior. Policy source: **`docs/development/backend-standards.md`**.

Also read:

- NENE2: `docs/development/database-migrations.md`, `test-database-strategy.md`

## Schema and migrations

- [ ] New/changed tables have Phinx migration in `database/migrations/`.
- [ ] Schema snapshot updated in `database/schema/{table}.sql`.
- [ ] Migrations reversible or rollback strategy documented.
- [ ] Migration class/file naming follows `YYYYMMDDHHMMSS_snake_description.php` convention.
- [ ] No secrets or environment-specific values in migration files.
- [ ] Indexes on foreign keys and common filter columns (`entity_type_id`, etc.).

## Soft delete and data model

- [ ] Soft delete columns (`is_deleted`, `deleted_at`) consistent with product rules.
- [ ] Repository queries exclude soft-deleted rows by default unless admin API documented otherwise.
- [ ] Entity / field table relationships documented in migration comments or schema docs.

## Repository layer

- [ ] SQL confined to `src/{Domain}/Pdo{Entity}Repository.php` only.
- [ ] Parameterized queries only — no concatenated user input in SQL.
- [ ] Repositories use `DatabaseQueryExecutorInterface` — not raw PDO in use cases.
- [ ] Row mapping to domain objects inside repository; use cases receive domain types.

## Testing

- [ ] `Pdo{Entity}RepositoryTest` with SQLite `:memory:` covers important contracts.
- [ ] Schema created in test `setUp()` — tests do not depend on migration runner state.

## PR

- [ ] PR notes mention `Self-review: database` when database-facing.
- [ ] `composer test` (database suite) passes for touched repositories.

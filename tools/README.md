# Tools

| Script | Purpose |
| --- | --- |
| `tools/validate-openapi.php` | Validate `docs/openapi/openapi.yaml` structure and `$ref` integrity |
| `tools/build-release.sh` | Build Tier A **release ZIP** (`vendor/` + frontend assets) for shared hosting |

Composer scripts:

```bash
composer check        # full quality gate
composer openapi      # OpenAPI validation only
composer mcp          # MCP catalog validation
composer release:zip  # build build/release/nene-corpus-<sha>.zip
```

## Release ZIP (Tier A)

Requires:

- PHP 8.4+ with `zip` extension (CLI `zip` command)
- Node.js 20+ and npm
- [NENE2](https://github.com/hideyukiMORI/NENE2) as a sibling directory (`../NENE2`) or `NENE2_DIR`

```bash
composer release:zip
```

Output: `build/release/nene-corpus-<git-sha>.zip`

Upload the extracted `nene-corpus/` folder via FTP, point the vhost (or subdirectory) at `public_html/`, then open `/install/`.

See [`docs/deployment/shared-hosting.md`](../docs/deployment/shared-hosting.md).

# Tools

| Script | Purpose |
| --- | --- |
| `tools/validate-openapi.php` | Validate `docs/openapi/openapi.yaml` structure and `$ref` integrity |

Composer scripts:

```bash
composer check      # full quality gate
composer openapi    # OpenAPI validation only
composer mcp        # MCP catalog validation
```

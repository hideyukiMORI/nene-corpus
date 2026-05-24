# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main    | ✅        |

We currently support the latest `main` branch only. Older commits are not patched.

## Reporting a Vulnerability

**Please do not open a public GitHub Issue for security vulnerabilities.**

Use [GitHub Private Vulnerability Reporting](https://github.com/hideyukiMORI/nene-corpus/security/advisories/new) to report vulnerabilities confidentially.

### What to include

- A clear description of the vulnerability
- Steps to reproduce (proof of concept if possible)
- The potential impact and affected components
- Any suggested mitigations

### Response timeline

| Stage | Target |
| ----- | ------ |
| Acknowledgement | Within 3 business days |
| Initial assessment | Within 7 business days |
| Fix or mitigation | Depends on severity (critical: ASAP, high: 30 days, others: 90 days) |
| Public disclosure | After fix is available |

## Scope

This policy covers the NeNe Corpus application code in this repository.
It does not cover the NENE2 framework (report to [hideyukiMORI/NENE2](https://github.com/hideyukiMORI/NENE2)) or third-party dependencies.

## Product-specific concerns

- Uploaded documents may contain sensitive business data — treat storage and ACL as in-scope.
- LLM API keys and upstream CMS credentials must never appear in logs or public responses.
- Prompt injection via user chat input is an expected threat model — report bypasses of corpus scope controls.

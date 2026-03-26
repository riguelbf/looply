# Integration Model

## Purpose

Define how looply should represent external integrations without coupling the platform to runtime execution too early.

## Layers

### 1. Integration Context

Current supported layer.

- Artifact-first
- Markdown with frontmatter
- Read by hosts for reasoning and navigation
- No secret values
- No executable adapter logic

Location:

- `.looply/custom/integrations/integrations-index.md`
- `.looply/custom/integrations/<integration-name>.md`

Recommended frontmatter:

```yaml
schema: looply/integration-context@v1
name: stripe
status: active
coverage: medium
category: payments
owner: billing-platform
project_mode: existing-project
inference_policy: codebase-first-with-artifact-acceleration
source_of_truth: codebase+ops
touchpoints:
  - src/payments/stripe
  - src/webhooks/stripe
env_refs:
  - STRIPE_API_KEY
secret_refs:
  - vault:payments/stripe/webhook-secret
adapter_refs: []
related_artifacts:
  - prd
  - story-to-production
last_validated_at: 2026-03-26
```

### 2. Integration Adapter

Future layer for runtime execution support.

Role:

- bridge a known integration to an executable operation
- stay behind a port/adapters boundary
- remain independent from the reasoning artifact

Suggested structure:

```text
.looply/custom/integrations/adapters/
  README.md
  stripe.adapter.md
  github.adapter.md
```

Suggested metadata:

- adapter name
- supported operations
- required capabilities
- referenced integration context
- referenced secret handles

### 3. Integration Secrets And Config

Future secure operations layer.

Role:

- describe where secrets/config live
- never store raw values
- point to env vars, vault paths, secret IDs or runtime handles

Suggested structure:

```text
.looply/custom/integrations/secrets/
  README.md
  stripe.secrets.md
  github.secrets.md
```

Suggested metadata:

- env refs
- secret manager refs
- rotation owner
- environments
- validation status

## Host Consumption Rules

For now, hosts should only consume `integration context`.

Rules:

1. If a feature mentions a known integration, open the integration context file first.
2. If the file is `draft`, `stale`, `empty` or inconsistent, inspect the real codebase.
3. Use `touchpoints` to navigate the repository quickly.
4. Use `env_refs` and `secret_refs` only as references, never as values.
5. Treat `adapter_refs` as future links, not executable instructions.

## Evolution Path

V1:

- integration context only
- index and template
- host instructions to consult integration context

V2:

- adapter contracts
- refresh/validation of integration context
- integration-aware feature templates

V3:

- secure secret/config references
- optional adapter execution support

---
schema: looply/rule@v1
name: security-policies
category: security-policies
summary: Authentication patterns, data handling and secrets management rules
priority: high
applies_to:
  - all
tags:
  - security
  - auth
  - secrets
---

# Security Policies

## Purpose

Define security rules that agents must follow for authentication, authorization, data handling and secrets management.

## Rules

- Never hardcode secrets, keys or credentials in source code.
- Use environment variables or a secrets manager for sensitive configuration.
- Validate and sanitize all external inputs.
- Apply the principle of least privilege for all access controls.
- Log security-relevant events without exposing sensitive data.
- Use parameterized queries or ORM methods to prevent injection.

## Examples

- Correct: `apiKey = process.env.STRIPE_API_KEY`
- Wrong: `const apiKey = "sk_live_12345"`

## Enforcement

- Secrets scanning in CI/CD pipeline.
- Security review gate in the delivery workflow.
- Use .gitignore to prevent accidental commits of sensitive files.

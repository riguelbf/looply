---
schema: looply/rule@v1
name: project-conventions
category: project-conventions
summary: Commit style, PR process, branching strategy and release conventions
priority: medium
applies_to:
  - all
tags:
  - process
  - collaboration
  - conventions
---

# Project Conventions

## Purpose

Define project-level conventions for collaboration that agents must follow when interacting with version control, pull requests and releases.

## Rules

- Follow the project's established branching strategy.
- Write clear, descriptive commit messages.
- PRs must include a summary of changes and link to the relevant story.
- Do not commit generated files or build artifacts.
- Changes that affect multiple concerns should be split into separate PRs.

## Examples

- Good commit: `feat: add retry logic to payment processing`
- Bad commit: `fix stuff`

## Enforcement

- Branch protection rules enforce review requirements.
- CI checks run on every PR.
- Commit message convention enforced via hooks or CI.

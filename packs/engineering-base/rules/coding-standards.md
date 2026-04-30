---
schema: looply/rule@v1
name: coding-standards
category: coding-standards
summary: Language-specific coding conventions and formatting standards
priority: high
applies_to:
  - all
tags:
  - coding
  - standards
  - conventions
---

# Coding Standards

## Purpose

Define language-specific conventions, naming, formatting and linting rules that agents must follow when producing code.

## Rules

- Prefer idiomatic patterns for the target language and framework.
- Follow the existing codebase conventions over generic style guides.
- Use the project's configured linter and formatter settings.
- Name variables, functions and classes descriptively.

## Examples

- Good: `calculateTotalInvoice(items)` -- clear action + noun
- Bad: `calc(items)` -- too abbreviated and unclear

## Enforcement

- Linting rules defined in project config (`.eslintrc`, `.prettierrc`, etc.).
- Code review checklist references this rule set.

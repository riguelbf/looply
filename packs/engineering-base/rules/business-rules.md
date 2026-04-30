---
schema: looply/rule@v1
name: business-rules
category: business-rules
summary: Domain-specific constraints, validation rules and business invariants
priority: medium
applies_to:
  - pm-analyst
  - architect
  - backend
tags:
  - domain
  - business
  - validation
---

# Business Rules

## Purpose

Define domain-specific constraints, validation rules and business invariants that agents must respect when designing or implementing features.

## Rules

- Document business rules explicitly before implementing.
- Validate business constraints in the domain layer, not in controllers.
- Business rules must be testable and independently verifiable.
- Do not invent business rules -- derive them from PRDs, stories or stakeholder input.
- Escalate ambiguity in business rules to the product owner.

## Examples

- "A user can only have one active subscription at a time."
- "Order total must be recalculated when line items change."
- "Discount codes expire 30 days after issuance."

## Enforcement

- Domain layer validation enforces invariants.
- Business rule tests in the test suite.
- PRD and story acceptance criteria must reference applicable business rules.

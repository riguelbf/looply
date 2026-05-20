---
schema: looply/context-ledger@v2
name: context-ledger
summary: Append-only shared memory for accumulated feature decisions, rationale, constraints and risks across workflow stages. Stored as SQLite database.
---

# Context Ledger

The context ledger is now stored as a SQLite database at `.looply/custom/features/<feature-name>/context-ledger.db`.

**Do not read or write this file directly.** Use the `looply ledger` CLI commands:

- Init: `looply ledger init --feature <feature-name>`
- Read summary: `looply ledger read --feature <feature-name> --summary-only`
- Read all: `looply ledger read --feature <feature-name>`
- Append stage entry: `looply ledger append --feature <feature-name> --stage <name> --decision <text> --rationale <text> --constraints <text> --risks <text>`
- Update summary: `looply ledger summary update --feature <feature-name> --text <summary>`

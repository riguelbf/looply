---
schema: looply/mcp@v1
name: postgres
label: PostgreSQL
summary: MCP server for PostgreSQL - query and inspect PostgreSQL databases
description: Connects your AI agent to PostgreSQL databases for running read-only queries and inspecting schemas.
package: "@modelcontextprotocol/server-postgres"
env_vars:
  - name: POSTGRES_CONNECTION_STRING
    label: PostgreSQL Connection String
    prompt: "Connection URI (e.g., postgresql://user:password@localhost:5432/mydb)"
    type: text
    required: true
config_template:
  opencode: |
    {
      "mcpServers": {
        "postgres": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-postgres", "${POSTGRES_CONNECTION_STRING}"]
        }
      }
    }
  codex: ""
  claude: ""
---

---
schema: looply/mcp@v1
name: postgres
label: PostgreSQL
summary: MCP server for PostgreSQL - query and manage PostgreSQL databases
description: Connects your AI agent to PostgreSQL databases for running queries, inspecting schemas and managing data.
package: "@modelcontextprotocol/server-postgres"
env_vars:
  - name: POSTGRES_HOST
    label: PostgreSQL Host
    prompt: "PostgreSQL server hostname or IP address"
    type: text
    required: true
  - name: POSTGRES_PORT
    label: PostgreSQL Port
    prompt: "PostgreSQL server port (default: 5432)"
    type: text
    required: false
  - name: POSTGRES_USER
    label: PostgreSQL User
    prompt: "PostgreSQL username with read/write access"
    type: text
    required: true
  - name: POSTGRES_PASSWORD
    label: PostgreSQL Password
    prompt: "PostgreSQL user password"
    type: password
    required: true
  - name: POSTGRES_DATABASE
    label: PostgreSQL Database
    prompt: "Database name to connect to"
    type: text
    required: true
config_template:
  opencode: |
    {
      "mcpServers": {
        "postgres": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-postgres"],
          "env": {
            "POSTGRES_HOST": "${POSTGRES_HOST}",
            "POSTGRES_PORT": "${POSTGRES_PORT}",
            "POSTGRES_USER": "${POSTGRES_USER}",
            "POSTGRES_PASSWORD": "${POSTGRES_PASSWORD}",
            "POSTGRES_DATABASE": "${POSTGRES_DATABASE}"
          }
        }
      }
    }
  codex: ""
  claude: ""
---

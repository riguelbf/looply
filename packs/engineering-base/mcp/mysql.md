---
schema: looply/mcp@v1
name: mysql
label: MySQL
summary: MCP server for MySQL - query and inspect MySQL databases (read-only)
description: Connects your AI agent to MySQL databases for running read-only queries and inspecting schemas.
package: "mcp-server-mysql"
env_vars:
  - name: MYSQL_HOST
    label: MySQL Host
    prompt: "MySQL server hostname or IP address (default: 127.0.0.1)"
    type: text
    required: true
  - name: MYSQL_PORT
    label: MySQL Port
    prompt: "MySQL server port (default: 3306)"
    type: text
    required: false
  - name: MYSQL_USER
    label: MySQL User
    prompt: "MySQL username with read access (default: root)"
    type: text
    required: true
  - name: MYSQL_PASS
    label: MySQL Password
    prompt: "MySQL user password"
    type: password
    required: true
  - name: MYSQL_DB
    label: MySQL Database
    prompt: "Database name to connect to (optional, enables multi-DB mode if not set)"
    type: text
    required: false
config_template:
  opencode: |
    {
      "mcpServers": {
        "mysql": {
          "command": "npx",
          "args": ["-y", "mcp-server-mysql"],
          "env": {
            "MYSQL_HOST": "${MYSQL_HOST}",
            "MYSQL_PORT": "${MYSQL_PORT}",
            "MYSQL_USER": "${MYSQL_USER}",
            "MYSQL_PASS": "${MYSQL_PASS}",
            "MYSQL_DB": "${MYSQL_DB}"
          }
        }
      }
    }
  codex: ""
  claude: ""
---

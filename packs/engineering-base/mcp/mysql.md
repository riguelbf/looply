---
schema: looply/mcp@v1
name: mysql
label: MySQL
summary: MCP server for MySQL - query and manage MySQL databases
description: Connects your AI agent to MySQL databases for running queries, inspecting schemas and managing data.
package: "@modelcontextprotocol/server-mysql"
env_vars:
  - name: MYSQL_HOST
    label: MySQL Host
    prompt: "MySQL server hostname or IP address"
    type: text
    required: true
  - name: MYSQL_PORT
    label: MySQL Port
    prompt: "MySQL server port (default: 3306)"
    type: text
    required: false
  - name: MYSQL_USER
    label: MySQL User
    prompt: "MySQL username with read/write access"
    type: text
    required: true
  - name: MYSQL_PASSWORD
    label: MySQL Password
    prompt: "MySQL user password"
    type: password
    required: true
  - name: MYSQL_DATABASE
    label: MySQL Database
    prompt: "Database name to connect to"
    type: text
    required: true
config_template:
  opencode: |
    {
      "mcpServers": {
        "mysql": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-mysql"],
          "env": {
            "MYSQL_HOST": "${MYSQL_HOST}",
            "MYSQL_PORT": "${MYSQL_PORT}",
            "MYSQL_USER": "${MYSQL_USER}",
            "MYSQL_PASSWORD": "${MYSQL_PASSWORD}",
            "MYSQL_DATABASE": "${MYSQL_DATABASE}"
          }
        }
      }
    }
  codex: ""
  claude: ""
---

---
schema: looply/mcp@v1
name: linear
label: Linear
summary: MCP server for Linear - issues, projects and cycles management
description: Connects your AI agent to Linear for managing issues, projects, cycles and team workflows.
package: "@modelcontextprotocol/server-linear"
env_vars:
  - name: LINEAR_API_KEY
    label: Linear API Key
    prompt: "Create an API key at https://linear.app/settings/api"
    type: password
    required: true
config_template:
  opencode: |
    {
      "mcpServers": {
        "linear": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-linear"],
          "env": {
            "LINEAR_API_KEY": "${LINEAR_API_KEY}"
          }
        }
      }
    }
  codex: ""
  claude: ""
---

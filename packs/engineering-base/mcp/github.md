---
schema: looply/mcp@v1
name: github
label: GitHub
summary: MCP server for GitHub - repos, issues, pull requests and code search
description: Connects your AI agent to GitHub for managing repositories, issues, pull requests, and searching code.
package: "@modelcontextprotocol/server-github"
env_vars:
  - name: GITHUB_PERSONAL_ACCESS_TOKEN
    label: GitHub Personal Access Token (classic)
    prompt: "Create a classic token at https://github.com/settings/tokens with scopes: repo, read:org, issues"
    type: password
    required: true
config_template:
  opencode: |
    {
      "mcpServers": {
        "github": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-github"],
          "env": {
            "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
          }
        }
      }
    }
  codex: ""
  claude: ""
---

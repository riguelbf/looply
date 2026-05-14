---
schema: looply/mcp@v1
name: elk
label: ELK (Elasticsearch)
summary: MCP server for Elasticsearch - search and analyze data
description: Connects your AI agent to Elasticsearch for searching, listing indices, and analyzing data.
package: "@elastic/mcp-server-elasticsearch"
env_vars:
  - name: ES_URL
    label: Elasticsearch URL
    prompt: "Elasticsearch endpoint URL (e.g., https://elastic.example.com:9200)"
    type: text
    required: true
  - name: ES_API_KEY
    label: Elasticsearch API Key
    prompt: "Base64-encoded API key for Elasticsearch authentication"
    type: password
    required: true
config_template:
  opencode: |
    {
      "mcpServers": {
        "elk": {
          "command": "npx",
          "args": ["-y", "@elastic/mcp-server-elasticsearch"],
          "env": {
            "ES_URL": "${ES_URL}",
            "ES_API_KEY": "${ES_API_KEY}"
          }
        }
      }
    }
  codex: ""
  claude: ""
---

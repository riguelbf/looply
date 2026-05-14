---
schema: looply/mcp@v1
name: elk
label: ELK (Elasticsearch + Kibana)
summary: MCP server for Elasticsearch - search and analyze logs and metrics
description: Connects your AI agent to Elasticsearch clusters for searching, analyzing logs and monitoring observability data.
package: "@modelcontextprotocol/server-elasticsearch"
env_vars:
  - name: ELASTICSEARCH_URL
    label: Elasticsearch URL
    prompt: "Elasticsearch endpoint URL (e.g., https://elastic.example.com:9200)"
    type: text
    required: true
  - name: ELASTICSEARCH_API_KEY
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
          "args": ["-y", "@modelcontextprotocol/server-elasticsearch"],
          "env": {
            "ELASTICSEARCH_URL": "${ELASTICSEARCH_URL}",
            "ELASTICSEARCH_API_KEY": "${ELASTICSEARCH_API_KEY}"
          }
        }
      }
    }
  codex: ""
  claude: ""
---

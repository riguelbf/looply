---
schema: looply/mcp@v1
name: grafana
label: Grafana
summary: MCP server for Grafana - dashboards, alerts and data source management
description: Connects your AI agent to Grafana for creating dashboards, managing alerts, and querying data sources.
package: "mcp-grafana-npx"
env_vars:
  - name: GRAFANA_URL
    label: Grafana URL
    prompt: "Grafana instance URL (e.g., https://grafana.example.com)"
    type: text
    required: true
  - name: GRAFANA_SERVICE_ACCOUNT_TOKEN
    label: Grafana Service Account Token
    prompt: "Create a service account token at Grafana Admin > Service Accounts"
    type: password
    required: true
config_template:
  opencode: |
    {
      "mcpServers": {
        "grafana": {
          "command": "npx",
          "args": ["-y", "mcp-grafana-npx"],
          "env": {
            "GRAFANA_URL": "${GRAFANA_URL}",
            "GRAFANA_SERVICE_ACCOUNT_TOKEN": "${GRAFANA_SERVICE_ACCOUNT_TOKEN}"
          }
        }
      }
    }
  codex: ""
  claude: ""
---

---
schema: looply/mcp@v1
name: kubernetes
label: Kubernetes
summary: MCP server for Kubernetes - pods, deployments, services and cluster management
description: Connects your AI agent to Kubernetes clusters via kubectl. Requires kubectl installed and configured with a valid kubeconfig.
package: "mcp-server-kubernetes"
env_vars: []
config_template:
  opencode: |
    {
      "mcpServers": {
        "kubernetes": {
          "command": "npx",
          "args": ["-y", "mcp-server-kubernetes"]
        }
      }
    }
  codex: ""
  claude: ""
---

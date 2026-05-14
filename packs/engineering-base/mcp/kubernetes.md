---
schema: looply/mcp@v1
name: kubernetes
label: Kubernetes
summary: MCP server for Kubernetes - pods, deployments, services and cluster management
description: Connects your AI agent to Kubernetes clusters for managing pods, deployments, services and viewing cluster state.
package: "@modelcontextprotocol/server-kubernetes"
env_vars:
  - name: KUBECONFIG_PATH
    label: Path to kubeconfig file
    prompt: "Absolute path to your Kubernetes config file (e.g., /home/user/.kube/config)"
    type: text
    required: true
config_template:
  opencode: |
    {
      "mcpServers": {
        "kubernetes": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-kubernetes"],
          "env": {
            "KUBECONFIG": "${KUBECONFIG_PATH}"
          }
        }
      }
    }
  codex: ""
  claude: ""
---

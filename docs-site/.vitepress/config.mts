import { defineConfig } from "vitepress";

const usePolling = process.env.LOOPLY_DOCS_USE_POLLING !== "false";
const pollInterval = Number(process.env.LOOPLY_DOCS_POLL_INTERVAL ?? "1000");
const docsBase = process.env.LOOPLY_DOCS_BASE ?? "/";

export default defineConfig({
  title: "looply",
  description: "Portal de documentacao da plataforma de artefatos para engenharia assistida por IA.",
  lang: "pt-BR",
  appearance: "dark",
  base: docsBase,
  srcDir: ".",
  cleanUrls: false,
  lastUpdated: true,
  head: [
    ["meta", { name: "theme-color", content: "#0B0F1A" }]
  ],
  vite: {
    server: {
      watch: {
        usePolling,
        interval: Number.isFinite(pollInterval) && pollInterval > 0 ? pollInterval : 1000,
        ignored: [
          "**/.git/**",
          "**/.looply/**",
          "**/dist/**",
          "**/node_modules/**"
        ]
      }
    }
  },
  themeConfig: {
    logo: { src: "/mark.svg", alt: "looply" },
    nav: [
      { text: "Visao Geral", link: "/overview/" },
      { text: "Guias", link: "/guides/getting-started" },
      { text: "Playbooks", link: "/playbooks/" },
      { text: "Hosts", link: "/guides/hosts" },
      { text: "Slash Commands", link: "/guides/slash-commands" },
      { text: "Referencia", link: "/reference/cli/" },
      { text: "Specs", link: "/specs/" }
    ],
    sidebar: {
      "/overview/": [
        {
          text: "Visao Geral",
          items: [
            { text: "Produto", link: "/overview/" },
            { text: "Arquitetura", link: "/overview/architecture" },
            { text: "Conceitos", link: "/overview/concepts" }
          ]
        }
      ],
      "/guides/": [
        {
          text: "Guias",
          items: [
            { text: "Getting Started", link: "/guides/getting-started" },
            { text: "Instalacao", link: "/guides/installation" },
            { text: "Hosts Suportados", link: "/guides/hosts" },
            { text: "Comportamento dos Hosts", link: "/guides/host-behavior" },
            { text: "Slash Commands", link: "/guides/slash-commands" },
            { text: "Agentes e Workflows", link: "/guides/catalog" },
            { text: "Primeira Feature", link: "/guides/first-feature" },
            { text: "Troubleshooting", link: "/guides/troubleshooting" },
            { text: "Fluxo de Workflows", link: "/guides/workflows" },
            { text: "Integracoes", link: "/guides/integrations" },
            { text: "Tools", link: "/guides/tools" }
          ]
        }
      ],
      "/playbooks/": [
        {
          text: "Playbooks",
          items: [
            { text: "Indice", link: "/playbooks/" },
            { text: "PM Analyst", link: "/playbooks/pm-analyst" },
            { text: "Architect", link: "/playbooks/architect" },
            { text: "Backend Developer", link: "/playbooks/backend-developer" },
            { text: "Reviewer", link: "/playbooks/reviewer" }
          ]
        }
      ],
      "/reference/": [
        {
          text: "Referencia",
          items: [
            { text: "CLI", link: "/reference/cli/" },
            { text: "Comandos", link: "/reference/generated/commands" },
            { text: "Slash Commands", link: "/reference/generated/slash-commands" },
            { text: "Agents", link: "/reference/generated/agents" },
            { text: "Tasks", link: "/reference/generated/tasks" },
            { text: "Workflows", link: "/reference/generated/workflows" },
            { text: "Knowledge", link: "/reference/generated/knowledge" },
            { text: "Templates", link: "/reference/generated/templates" },
            { text: "Checklists", link: "/reference/generated/checklists" },
            { text: "Rules", link: "/reference/generated/rules" },
            { text: "Integracoes", link: "/reference/generated/integrations" }
          ]
        }
      ],
      "/specs/": [
        {
          text: "Specs",
          items: [
            { text: "Indice", link: "/specs/" },
            { text: "Platform Model", link: "/specs/platform-model" },
            { text: "Platform Contracts", link: "/specs/platform-contracts" },
            { text: "Publishing Model", link: "/specs/publishing-model" },
            { text: "Integration Model", link: "/specs/integration-model" }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/riguelbf/looply" }
    ],
    search: {
      provider: "local"
    },
    outline: {
      level: [2, 3]
    },
    footer: {
      message: "Artifact-first documentation for looply.",
      copyright: "looply"
    }
  }
});

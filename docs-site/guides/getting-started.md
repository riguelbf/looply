# Getting Started

## 1. Instale dependencias do projeto

```bash
npm install
```

## 2. Compile a CLI

```bash
npm run build
```

## 3. Instale o pack base

```bash
node ./bin/run.js install --host codex,claude --scope project --pack engineering-base --locale pt-BR --project-mode existing-project --interaction-mode autonomous --yes
```

## 4. Valide a instalacao

```bash
node ./bin/run.js validate
node ./bin/run.js doctor --host codex,claude --scope project
```

## 5. Inicie o primeiro workflow

No host:

```text
/looply:idea-to-prd pix-webhook-retry "falhas transientes no webhook PIX geram reconciliacao manual"
```


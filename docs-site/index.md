---
layout: home

hero:
  name: "looply"
  text: "O contexto que falta entre seu codebase e sua IA"
  tagline: "looply ensina seus agentes de IA a entenderem seu projeto de verdade — codebase, regras, integracoes, historico. O resultado e codigo com a precisao de um time senior, nao a aposta de um modelo generico."
  actions:
    - theme: brand
      text: Instalar
      link: /guides/getting-started
    - theme: alt
      text: Como funciona
      link: /overview/

features:
  - icon: 🧠
    title: Ensina seu contexto a IA
    details: Cada agente recebe o knowledge graph real do seu codebase, regras do time e historico da feature. Nada de prompt generico com "voce e um senior developer".
  - icon: 📋
    title: Artefatos, nao sugestoes
    details: Packs versionados de workflows, agents, tasks, templates e checklists. O looply publica contratos — seus hosts de IA executam com calibracao consistente.
  - icon: 🔄
    title: Um contrato, varios hosts
    details: O mesmo pack funciona em Codex, Claude Code e OpenCode. Sem duplicacao, sem lock-in. O looply traduz para o formato nativo de cada host.
---

<div class="lp-section lp-problem">

## 01 &middot; O Problema

<div class="lp-before-after">

<div class="lp-before">

### Sem looply

Agentes de IA genericos produzem codigo inconsistente. Nao conhecem sua arquitetura, ignoram suas regras de time, inventam padroes que nao existem no projeto. Cada sessao comeca do zero — e cada output e uma aposta.

</div>

<div class="lp-after">

### Com looply

Agentes operam com conhecimento profundo do seu codebase. Respeitam suas convencoes, consultam seu historico de features, seguem seus workflows de qualidade. O output e previsivel, revisavel e alinhado com o que seu time espera.

</div>

</div>

</div>

<div class="lp-section lp-foundation">

## 02 &middot; A Base

Antes de qualquer agente executar, o looply constroi uma **camada de contexto** que carrega em toda sessao.

<div class="lp-foundation-grid">

<div class="lp-foundation-item">

**Knowledge Graph.** Classes, funcoes, tabelas de banco, migracoes — tudo extraido automaticamente do seu codebase. Zero credenciais lidas. Zero configuracao manual.

</div>

<div class="lp-foundation-item">

**Regras do time.** Convencoes de codigo, politicas de seguranca, gates de qualidade. Regras que seu time ja segue — agora seus agentes tambem seguem.

</div>

<div class="lp-foundation-item">

**Contexto de integracoes.** APIs externas, servicos, autenticacao. Stripe, AWS, SendGrid — o que seu projeto usa, seus agentes conhecem.

</div>

<div class="lp-foundation-item">

**Historico da feature.** PRDs, stories, tech specs, decisoes de arquitetura. Cada agente consulta o que ja foi decidido antes de propor qualquer coisa.

</div>

</div>

</div>

<div class="lp-section lp-language">

## 03 &middot; A Linguagem

Quatro workflows dao ao seu time um vocabulario compartilhado com a IA. Cada um mapeia uma fase do ciclo de engenharia — da ideia ate a producao.

<div class="lp-lang-grid">

<div class="lp-lang-item">

**Idea → PRD.** Transforme uma ideia bruta em um PRD aprovado. O agente `pm-analyst` investiga, valida e consolida — sempre alinhado com o contexto real do projeto.

</div>

<div class="lp-lang-item">

**PRD → Stories.** Quebre o PRD em backlog acionavel. Cada story nasce com criterios de aceitacao e vinculo com as entidades do codigo que serao impactadas.

</div>

<div class="lp-lang-item">

**Story → Producao.** Design tecnico, implementacao, review e release plan. `architect` desenha, `backend` implementa, `reviewer` valida — tudo orquestrado.

</div>

<div class="lp-lang-item">

**Workflow Status.** Retome de onde parou. O looply persiste o estado de cada feature. Nenhuma sessao comeca do zero — seus agentes sempre sabem o proximo passo.

</div>

</div>

</div>

<div class="lp-section lp-case">

## 04 &middot; Por que isso importa

<div class="lp-case-grid">

<span class="lp-case-num">01</span>
**Calibracao consistente.** Todo agente, em toda sessao, em qualquer host, recebe o mesmo contexto de projeto. Sem drift. Sem surpresas.

<span class="lp-case-num">02</span>
**Packs, nao prompts.** Engenharia de software tem camadas. O looply empacota anos de boas praticas em modulos reusaveis. Instale, combine, estenda.

<span class="lp-case-num">03</span>
**Host-agnostic, host-native.** O looply publica o contrato — cada host traduz para seu formato. Codex, Claude Code e OpenCode consomem o mesmo pack sem duplicacao.

<span class="lp-case-num">04</span>
**Contexto real, nao copy-paste.** O knowledge graph e extraido do codebase. Classes, tabelas, migracoes — mapeado e servido aos agentes. Nada de "analise esse arquivo" manual.

<span class="lp-case-num">05</span>
**Artefatos como fonte de verdade.** Agents, tasks, workflows, templates, checklists — versionados, curados e calibrados. O contrato que seus agentes de IA merecem.

<span class="lp-case-num">06</span>
**Produto, nao ferramenta.** O looply nao e um prompt generator. E uma plataforma de artefatos que vive no seu repositorio e evolui com seu time.

</div>

</div>

<div class="lp-section lp-install">

## 05 &middot; Instalar

<div class="lp-install-steps">

<div class="lp-install-step">

### 1. Instale o CLI

```bash
npx @looply-cli/looply install
```

Um comando. O looply analisa seu codebase, detecta hosts ativos e publica packs, skills, comandos e contexto. Em segundos.

</div>

<div class="lp-install-step">

### 2. Use nos seus hosts

Os aliases `/looply:*` aparecem automaticamente no Codex e Claude Code. Abra seu host de IA, digite `/looply:` e veja os workflows disponiveis.

</div>

<div class="lp-install-step">

### 3. Mantenha atualizado

```bash
looply sync
```

Sincroniza packs, contexto de projeto e integracoes. Mantenha seus agentes calibrados com a versao mais recente da plataforma.

</div>

</div>

<div class="lp-install-cta">
  <a href="/guides/getting-started" class="lp-btn-primary">Guia completo de instalacao →</a>
</div>

</div>

<div class="lp-section lp-updates">

## 06 &middot; O que tem de novo

- **OpenCode host publisher** — suporte nativo para o host OpenCode, publicando skills, comandos e playbooks no formato `.agents/skills/`.
- **looply-skill-search** — skill de discovery obrigatoria que garante que o agente descubra o workflow certo antes de agir.
- **Skill creator interativo** — crie novas skills looply com um comando (`/looply:skill-creator`), gerando SKILL.md, agents yamls e indices automaticamente.
- **Knowledge graph com schema de banco** — extracao estatica de schemas Prisma, Drizzle, TypeORM e SQL migrations. FK references, tabelas e colunas mapeadas sem conexao ao banco.

</div>

<div class="lp-section lp-faq">

## 07 &middot; Perguntas Frequentes

**looply funciona em qualquer projeto?**

Sim. O looply detecta automaticamente TypeScript, Python, Shell e outros. Em projetos existentes, ele analisa o codebase real como fonte primaria de verdade.

**Preciso de GPU ou API keys?**

Nao. O looply e uma plataforma de artefatos offline. Ele publica arquivos Markdown e YAML que seus hosts de IA consomem. Quem executa e o host (Codex, Claude Code), nao o looply.

**Funciona com Cursor, Copilot, outros?**

O looply publica para Codex, Claude Code e OpenCode. Outros hosts podem ser adicionados via contrato de publishing. O modelo e host-agnostic.

**E open source?**

Sim. Apache 2.0. Todo o codigo, packs e artefatos estao no GitHub.

**Como atualizo meus packs?**

```bash
looply sync
```

Um comando. O looply compara versoes, baixa atualizacoes e preserva suas customizacoes locais.

</div>

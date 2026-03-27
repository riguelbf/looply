# frontend-best-practices

Best practices for frontend implementation, UI architecture and client delivery

## Metadados

- summary: `Best practices for frontend implementation, UI architecture and client delivery`
- audience: `frontend`
- tags: `specialist`, `frontend`, `implementation`

## Conteudo do artefato

# Frontend Best Practices

## How To Think

- implementar o menor recorte que entrega valor sem quebrar consistencia visual, acessibilidade ou performance
- tratar o codebase real como fonte principal de verdade
- separar claramente preocupacoes de renderizacao, dados, estado e apresentacao
- otimizar por manutencao de longo prazo e previsibilidade de interface

## Always Do

- comecar perguntando se o contexto e projeto novo ou existente
- comecar perguntando se o baseline esperado e basico ou com boas praticas completas
- para projeto existente, entender a arquitetura atual antes de codar e registrar esse entendimento para reutilizacao futura
- para projeto novo, estruturar a solucao por modulos de features com componentes simples e coesos
- se a tecnologia nao estiver definida, sugerir React com shadcn/ui
- quando o baseline for simples, manter a stack base e reduzir camadas, dependencias, instrumentacao e abstrações prematuras
- quando o baseline for mais completo, preferir Next.js, TypeScript strict, renderizacao hibrida e abordagem server-first quando fizer sentido
- usar hooks para encapsular comportamento reutilizavel sem espalhar estado acidental
- usar TanStack Query para cache de servidor quando houver client cache e preferir fetch server-side quando possivel
- usar React Hook Form com Zod em fluxos relevantes de formulario
- separar estado local de UI, estado de servidor e estado global transversal
- usar design system com tokens, responsividade mobile-first e componentes acessiveis
- atualizar testes, documentacao e artefatos de qualidade quando a mudanca exigir
- registrar riscos de UX, performance, rollout e follow-ups

## Design Rules

- modularizar por feature antes de modularizar por tipo tecnico
- componentes devem ser pequenos, coesos e orientados ao caso de uso
- shared deve conter apenas o que realmente for transversal
- design system deve centralizar tokens, primitives e patterns
- evitar estado global por conveniencia; usar apenas quando o caso for realmente transversal
- separar composicao de tela, hooks, schemas, services e server code por feature
- preferir server-first e renderizacao hibrida quando reduzir custo no cliente e melhorar experiencia inicial
- UI deve ser acessivel por padrao, com foco em semantica, teclado, contraste e feedback de erro

## Baseline Modes

- basico: manter React, shadcn/ui, TypeScript e organizacao limpa, mas com menos camadas, menos pastas e menos dependencias
- basico: usar a menor quantidade de abstrações necessarias para entregar com clareza
- basico: evitar instrumentacao, estado global, cache sofisticado e design system extenso sem necessidade real
- avancado: usar Next.js, renderizacao hibrida, estrutura completa por features, instrumentacao, estrategia de performance e testes em camadas quando o contexto justificar
- avancado: aplicar a estrutura de referencia completa quando o produto, o time e a longevidade do sistema pedirem isso

## Data And State Rules

- distinguir explicitamente estado local de interacao de estado de servidor
- nao duplicar no client o que ja pode ser derivado do servidor
- usar invalidacao e cache de forma consciente para evitar staleness invisivel
- manter schemas de entrada e saida proximos ao modulo que consome o contrato
- formularios devem ter validacao clara no cliente e validacao definitiva no servidor

## Styling And Design Rules

- adotar tokens de design para cor, espacamento, tipografia, raio e elevacao
- manter responsividade mobile-first como baseline
- evitar estilos ad hoc espalhados sem convencao de ownership
- preferir Tailwind ou CSS Modules com convencoes fortes quando a stack nao vier definida
- preservar consistencia visual entre estados vazios, carregamento, erro e sucesso

## Quality Rules

- usar TypeScript strict, lint, testes e CI como baseline de qualidade
- cobrir componentes, hooks e fluxos criticos em camadas adequadas
- combinar testes unitarios, integracao de UI e smoke e2e conforme risco
- revisar acessibilidade, loading states, empty states e error states como parte da definicao de pronto

## Performance Rules

- tratar bundle budget como restricao real
- lazy load de modulos pesados, rotas e componentes quando fizer sentido
- otimizar imagens e assets
- evitar rerenders desnecessarios por desenho ruim de estado
- preferir streaming, suspense e server rendering quando a stack suportar e houver ganho real

## Security Rules

- nada sensivel no cliente
- regras criticas devem permanecer no servidor
- nao confiar em validacao apenas no frontend
- minimizar exposicao de dados e credenciais em requests, logs e analytics

## Suggested Stack

### Shared Baseline

- framework: Next.js
- linguagem: TypeScript
- UI: React com shadcn/ui e primitives acessiveis
- estilo: Tailwind ou CSS Modules com convencoes fortes
- qualidade: ESLint + Prettier + TypeScript strict

### Simple Baseline

- manter a stack base, mas com estrutura mais enxuta e menos dependencias
- preferir poucos modulos de feature, shared pequeno e sem estado global por padrao
- usar TanStack Query, RHF, instrumentacao e estrutura expandida apenas quando houver ganho claro

### Advanced Baseline

- framework: Next.js
- linguagem: TypeScript
- UI: React com shadcn/ui e primitives acessiveis
- estilo: Tailwind ou CSS Modules com convencoes fortes
- forms: React Hook Form + Zod
- data fetching e cache: TanStack Query quando houver cache no cliente; fetch server-side quando possivel
- estado global: Zustand, Jotai ou Redux Toolkit apenas para casos transversais
- testes: Vitest ou Jest + Testing Library + Playwright
- qualidade: ESLint + Prettier + TypeScript strict

## Reference Structure

Usar a estrutura abaixo como referencia de baseline avancado. No baseline simples, manter a mesma direcao, mas com menos camadas e apenas os modulos realmente necessarios.

```text
src/
  app/
    (public)/
    (authenticated)/
    api/
    layout.tsx
    page.tsx

  features/
    auth/
      components/
      hooks/
      server/
      schemas/
      services/
      state/
      tests/
      index.ts

    billing/
      components/
      server/
      services/
      schemas/
      state/
      tests/
      index.ts

    dashboard/
      components/
      server/
      services/
      tests/
      index.ts

  shared/
    components/
      ui/
      feedback/
      layout/
    lib/
      http/
      auth/
      date/
      format/
      analytics/
    hooks/
    schemas/
    types/
    constants/
    styles/
    tests/

  design-system/
    tokens/
    primitives/
    patterns/

  instrumentation/
    web-vitals/
    tracing/
    logging/
    error-reporting/
```

## Good Output Signals

- arquitetura de features clara
- componentes acessiveis e consistentes
- estado local e de servidor bem separados
- performance e seguranca tratadas explicitamente
- resumo objetivo do que mudou

## Bad Output Signals

- tela grande concentrando regra, fetch e estado demais
- estado global usado como atalho
- estilos sem tokens ou sem padrao
- regra critica implementada apenas no cliente
- ausencia de testes, loading states ou error handling

## Arquivo

- `packs/engineering-base/knowledge/specialists/frontend-best-practices.md`

[Voltar para knowledge](../knowledge)

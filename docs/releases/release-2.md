# Release 2

## Theme

Product hardening and host parity

## Scope

- publicacao de `skills` para `Codex`
- maior paridade operacional entre `Claude` e `Codex`
- `refresh-context` e ciclo de atualizacao do contexto do projeto
- `status` mais forte por feature, gate e proximo passo
- exemplo ponta a ponta versionado em `examples/`
- evolucao da modelagem de integracoes externas
- docs e onboarding mais profundos
- governanca mais forte de artefatos e contexto

## Detailed Goals

### Codex integration

- definir a estrategia oficial de `Codex skills`
- mapear workflows principais para unidades de extensao do `Codex`
- manter naming e descoberta coerentes com `/looply:*` no `Claude`
- melhorar a experiencia de uso do `Codex` sem depender apenas de `AGENTS.md`

### Project context

- introduzir `refresh-context`
- atualizar `project-context.md`, `session-context.md` e `context-index.md`
- aplicar estados de contexto:
  - `active`
  - `draft`
  - `stale`
  - `empty`
- deixar explicito quando confiar no artefato e quando usar o codebase real

### Orchestration and status

- enriquecer `delivery-orchestrator`
- tornar `workflow-status` mais prescritivo
- mostrar em `looply status`:
  - onde cada feature parou
  - gate atual
  - proximo workflow
  - proxima task

### Golden path

- adicionar um exemplo real ponta a ponta em `examples/`
- cobrir:
  - discovery
  - planning
  - delivery
  - status
  - integracoes relacionadas

### Integrations

- consolidar `integration context`
- estruturar o caminho para:
  - `integration adapter`
  - `integration secrets/config`
- ligar feature, workflow e integracoes impactadas

### Docs and governance

- aprofundar a documentacao para uso real
- adicionar guias operacionais para `Codex skills`
- reforcar validacoes semanticas e stale context
- adicionar lint e cobertura minima para artefatos criticos

## Out of Scope

- especializacao profunda por dominio
- clonagem de personas de mercado
- engenharia reversa completa de dominios legados
- squads de dominio alem do `engineering-base`

## Exit Criteria

- `Codex` com mecanismo oficial adicional de extensao validado
- `refresh-context` funcional
- `status` consolidado por feature
- exemplo ponta a ponta versionado
- docs cobrindo a jornada real de uso
- integracoes estruturadas em camadas

## Notes

- esta release e a evolucao direta da `v1`
- o foco e fortalecer produto, experiencia de host e governanca

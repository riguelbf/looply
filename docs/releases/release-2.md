# Release 2

## Theme

Product hardening, host parity and local desktop expansion

## Scope

- publicacao de `skills` para `Codex`
- maior paridade operacional entre `Claude` e `Codex`
- `refresh-context` e ciclo de atualizacao do contexto do projeto
- `refresh-code-context` para discovery multi-language
- `status` mais forte por feature, gate e proximo passo
- `icl example guidance` como camada explicita de calibracao
- `cli-autocomplete` derivado da arvore real do Commander
- `HOST_CONTRACT.md` e motor de autonomia host-driven
- exemplo ponta a ponta versionado em `examples/`
- evolucao da modelagem de integracoes externas
- companion desktop local para leitura, status e retomada
- docs e onboarding mais profundos
- governanca mais forte de artefatos e contexto

## Detailed Goals

### Codex integration

- definir a estrategia oficial de `Codex skills`
- mapear workflows principais para unidades de extensao do `Codex`
- manter naming e descoberta coerentes com `/looply:*` no `Claude`
- melhorar a experiencia de uso do `Codex` sem depender apenas de `AGENTS.md`
- garantir que `Codex` e `Claude Code` consumam o mesmo estado do projeto quando possivel

### Project context

- introduzir `refresh-context`
- introduzir `refresh-code-context`
- atualizar `project-context.md`, `session-context.md` e `context-index.md`
- aplicar estados de contexto:
  - `active`
  - `draft`
  - `stale`
  - `empty`
- deixar explicito quando confiar no artefato e quando usar o codebase real
- manter `project-snapshot.json` e `context-snapshot.json` como contratos consumiveis

### Orchestration and status

- enriquecer `delivery-orchestrator`
- tornar `workflow-status` mais prescritivo
- mostrar em `looply status`:
  - onde cada feature parou
  - gate atual
  - proximo workflow
  - proxima task
- incluir leitura de ICL, hosts e features em andamento

### CLI and autocomplete

- expor autocompletar baseado no Commander real
- manter bash e zsh como prioridade inicial
- evitar catalogo manual paralelo de comandos

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
- refletir `integrations` no status e no desktop

### Docs and governance

- aprofundar a documentacao para uso real
- adicionar guias operacionais para `Codex skills`
- reforcar validacoes semanticas e stale context
- adicionar lint e cobertura minima para artefatos criticos
- manter a documentacao sincronizada com o estado real da CLI e do desktop

## Out of Scope

- especializacao profunda por dominio
- clonagem de personas de mercado
- engenharia reversa completa de dominios legados
- squads de dominio alem do `engineering-base`
- substituir a CLI por uma GUI

## Exit Criteria

- `Codex` com mecanismo oficial adicional de extensao validado
- `refresh-context` funcional
- `refresh-code-context` funcional
- `status` consolidado por feature
- `cli-autocomplete` entregue para shells suportados
- `HOST_CONTRACT.md` publicado e consumido pelo host
- exemplo ponta a ponta versionado
- desktop local com leitura do snapshot e retomada de feature
- docs cobrindo a jornada real de uso
- integracoes estruturadas em camadas
- ICL guidance publicado e consumido pelos workflows relevantes

## Notes

- esta release e a evolucao direta da `v1`
- o foco e fortalecer produto, experiencia de host e governanca

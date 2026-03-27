---
schema: looply/knowledge@v1
name: backend-best-practices
summary: Best practices for backend implementation and code changes
audience:
  - backend
tags:
  - specialist
  - backend
  - implementation
---

# Backend Best Practices

## How To Think

- implementar o menor recorte que entrega valor com seguranca
- tratar o codebase real como fonte principal de verdade
- preservar fronteiras, testes e clareza da mudanca
- considerar contrato, persistencia e operacao como parte do mesmo trabalho
- otimizar por previsibilidade de manutencao, nao por cleverness

## Always Do

- comecar perguntando se o contexto e projeto novo ou existente
- comecar perguntando se o usuario quer baseline basico ou baseline de boas praticas completas
- para projeto existente, entender a arquitetura atual antes de codar e registrar esse entendimento para reutilizacao futura
- para projeto novo, estruturar a solucao desde o inicio com arquitetura modular, DDD, Clean Architecture e ports and adapters
- sugerir Node.js com NestJS se a stack backend nao estiver definida
- respeitar a stack informada quando ela ja vier decidida, sem abandonar as mesmas praticas estruturais
- sugerir PostgreSQL se o banco nao estiver definido
- usar Docker como baseline de execucao local, dependencias e entrega
- usar OpenAPI com Scalar para documentacao da API
- perguntar se autenticacao e necessaria no inicio; na ausencia de decisao, usar autenticacao basica
- revisar story, tech spec e ADR antes de codar
- localizar o modulo correto antes de alterar
- manter a mudanca pequena e coerente com o repositorio
- validar impacto em contrato de entrada, saida, eventos e schema persistido
- explicitar regras de validacao perto da borda de entrada
- manter handlers finos e concentrar comportamento em casos de uso ou servicos de dominio
- encapsular acesso a infraestrutura atras de fronteiras coerentes com o repositorio
- atualizar testes e documentacao quando a mudanca exigir
- verificar risco de compatibilidade retroativa, rollout, observabilidade e fallback
- produzir resumo de implementacao legivel para review

## Design Rules

- em projeto novo, modularizar por dominio desde o primeiro recorte
- preservar linguagem ubíqua e dominio rico; evitar anemico quando a regra justificar comportamento
- transporte nao deve decidir regra de negocio
- dominio nao deve depender de detalhes de framework ou IO
- aplicacao deve orquestrar casos de uso sem concentrar regra de negocio acidental
- repositories e gateways devem expor intencao de negocio, nao detalhes acidentais
- usar ports and adapters para banco, mensageria, autenticacao e integracoes externas
- jobs, consumers e webhooks devem ser idempotentes quando houver risco de repeticao
- validacao de input e serializacao de output devem ser explicitas
- erros devem ser categorizados para evitar `catch` generico sem semantica

## Data And Contracts

- toda mudanca de contrato deve indicar compatibilidade, consumidores afetados e estrategia de migracao
- toda mudanca de persistencia deve avaliar backfill, ordem de deploy e rollback
- evitar leitura e escrita acopladas a formato cru de terceiros; criar mapeamentos locais
- preferir defaults seguros e contratos estritos em vez de campos ambiguos

## Operational Rules

- adicionar logs, metricas ou eventos quando a feature exigir diagnostico operacional
- tratar timeout, retry e circuit breaker onde integracoes externas forem criticas
- nao esconder falhas relevantes atras de fallback silencioso
- considerar concorrencia, duplicacao de eventos e reprocessamento em fluxos assincronos
- usar Docker para padronizar ambiente, dependencias e bootstrap local
- manter docs OpenAPI atualizadas e publicadas com Scalar quando a API expuser contrato HTTP

## Testing Rules

- adotar TDD como baseline em projeto novo e como pratica preferencial em evolucoes relevantes
- cobrir comportamento critico, validacoes, erros esperados e regressao do caminho feliz
- preferir testes proximos ao comportamento alterado em vez de mocks excessivos de baixo valor
- incluir teste de contrato ou integracao quando a mudanca cruzar fronteira importante
- nao confiar so em teste manual para fluxo com persistencia, fila ou integracao

## Avoid

- inventar regra de negocio
- misturar refactor amplo com entrega da story
- alterar contratos sem refletir no spec
- deixar validacao implicita ou distribuida demais
- mascarar erro de integracao como sucesso parcial sem decisao explicita
- introduzir helper generico para evitar lidar com ownership claro
- deixar gaps sem registrar follow-up

## Quality Bar

- mudanca pequena, clara e testavel
- aderencia ao desenho tecnico
- fronteiras de modulo preservadas
- contrato e persistencia tratados com seguranca
- falhas e observabilidade consideradas
- risco residual explicado
- implementacao com resumo reutilizavel no review

## Escalate When

- a arquitetura nao for suficiente para implementar com seguranca
- o codebase nao refletir o contexto esperado
- houver necessidade de mudar regras ou contratos alem do aprovado
- a estrategia de rollout ou migracao trouxer risco de producao
- houver ambiguidade de ownership entre backend, devops e sre

## Good Output Signals

- diff focado
- entendimento documentado da arquitetura atual quando o projeto ja existe
- baseline tecnica clara para projeto novo
- handlers finos e fluxo legivel
- validacao e erros explicitos
- testes relevantes
- rollout e impacto operacional pensados
- resumo objetivo do que mudou

## Bad Output Signals

- mudanca ampla sem necessidade
- quebra de fronteira entre modulos
- projeto novo iniciado sem modularizacao por dominio
- decisao de stack, banco, autenticacao ou docs tomada implicitamente sem alinhamento
- endpoint orquestrando detalhes de infra e regra de negocio ao mesmo tempo
- mudanca de contrato sem estrategia de compatibilidade
- falta de evidencias de teste

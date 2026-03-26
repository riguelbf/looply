# devops-best-practices

Best practices for release preparation, rollout and operational delivery

## Metadados

- summary: `Best practices for release preparation, rollout and operational delivery`
- audience: `devops`
- tags: `specialist`, `devops`, `release`

## Conteudo do artefato

# DevOps Best Practices

## How To Think

- preparar publicacao segura e repetivel
- reduzir risco de rollout sem bloquear desnecessariamente
- tratar release como parte do produto, nao como pos-processo

## Always Do

- confirmar pre-condicoes tecnicas e operacionais
- definir ordem de publicacao, verificacao e rollback
- considerar feature flags, rollout gradual e dependencias
- deixar release plan acionavel para quem vai operar

## Avoid

- assumir que review tecnica cobre readiness operacional
- deixar rollback implicito
- misturar release com mudanca de escopo

## Quality Bar

- release plan claro, sequenciado e verificavel
- rollback simples e explicito
- dependencias e monitoracao minima descritas

## Escalate When

- o ambiente ou pipeline nao suportar o rollout esperado
- a mudanca depender de alteracao estrutural fora do escopo
- o risco operacional precisar de avaliacao de confiabilidade

## Good Output Signals

- pre-condicoes objetivas
- rollout gradual quando necessario
- verificacao pos-release clara

## Bad Output Signals

- publicacao sem rollback
- checklist operacional ausente
- plano genérico demais

## Arquivo

- `packs/engineering-base/knowledge/specialists/devops-best-practices.md`

[Voltar para knowledge](../knowledge)

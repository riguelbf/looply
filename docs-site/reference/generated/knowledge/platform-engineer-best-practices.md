# platform-engineer-best-practices

Best practices for platform foundations, templates and shared cloud guardrails

## Metadados

- summary: `Best practices for platform foundations, templates and shared cloud guardrails`
- audience: `platform-engineer`
- tags: `specialist`, `platform`, `enablement`

## Conteudo do artefato

# Platform Engineer Best Practices

## How To Think

- otimizar a plataforma para reaproveitamento, seguranca e velocidade dos times de produto
- reduzir variacao desnecessaria sem sufocar casos reais de dominio
- tratar experiencia do desenvolvedor como parte do produto interno

## Always Do

- padronizar foundation, pipelines, networking, identidade e observabilidade base
- transformar padroes recorrentes em templates, modulos e guardrails reutilizaveis
- definir ownership explicito do que e compartilhado e do que e customizavel
- desenhar a plataforma para facilitar uso correto e nao depender de memoria tribal

## Avoid

- acoplar plataforma a necessidade temporaria de um unico workload
- criar guardrail que so pode ser seguido manualmente
- confundir responsabilidade de plataforma com responsabilidade de runtime do produto

## Quality Bar

- baseline compartilhado claro
- automacao suficiente para reduzir erro operacional
- onboarding e uso previsiveis para times de dominio
- fronteiras entre shared e product-specific explicitas

## Escalate When

- um padrao de plataforma exigir excecao de seguranca ou governanca
- o custo de um baseline compartilhado precisar de avaliacao de finops
- um workload pedir customizacao que talvez deva virar padrao global

## Good Output Signals

- templates reutilizaveis
- guardrails claros
- padrao facil de adotar

## Bad Output Signals

- plataforma cheia de excecoes
- automacao insuficiente para sustentar o padrao
- ownership difuso entre plataforma e produto

## Arquivo

- `packs/engineering-base/knowledge/specialists/platform-engineer-best-practices.md`

[Voltar para knowledge](../knowledge)

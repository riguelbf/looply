---
schema: looply/knowledge@v1
name: cloud-operating-model
summary: Recommended cloud operating model and team boundaries for platform-oriented delivery
audience:
  - architect
  - cloud-architect
  - platform-engineer
  - cloud-governance
  - finops
  - devops
  - sre
tags:
  - cloud
  - platform
  - operating-model
---

# Cloud Operating Model

## Purpose

Definir fronteiras de responsabilidade entre plataforma, times de produto, governanca cloud, confiabilidade e custo para evitar overlap e lacunas operacionais.

## Guidance

- time de plataforma responde por foundation, IaC base, networking padrao, observabilidade padrao, identidade, pipelines, templates e guardrails
- times de produto ou dominio respondem por servicos de negocio, uso correto da plataforma, SLOs da aplicacao, evolucao funcional e custo do workload
- seguranca e cloud governance respondem por politicas globais, auditoria, posture, risco, conformidade e coordenacao de incidentes
- finops responde por visibilidade, rateio, otimizacao e previsibilidade de custo
- cloud architecture deve explicitar onde termina responsabilidade da plataforma e onde comeca a do workload
- platform engineering nao deve absorver customizacoes de um time de produto sem validar se aquilo merece virar padrao compartilhado
- governanca nao deve redesenhar workload quando o problema e falta de controle, politica ou aderencia
- finops nao deve recomendar cortes que quebrem requisitos de confiabilidade, seguranca ou produto sem trade-off explicito
- devops e sre atuam sobre release e operabilidade do servico, mas nao substituem plataforma, governanca ou finops

## Examples

- bom sinal: identidade, observabilidade e pipelines padrao definidos pela plataforma; workload usa o baseline sem reinventar tudo
- mau sinal: cada time cria sua propria rede, politica e tagging sem ownership central
- bom sinal: custo do workload atribuido ao time de produto e custo base da plataforma atribuido ao time de plataforma
- mau sinal: custo total cloud sem rateio, sem dono e sem previsao

## References

- `architecture-principles`
- especialistas de cloud, plataforma, governanca e finops

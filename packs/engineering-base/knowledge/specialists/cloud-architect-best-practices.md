---
schema: looply/knowledge@v1
name: cloud-architect-best-practices
summary: Best practices for cloud workload topology, resilience and service interaction design
audience:
  - cloud-architect
tags:
  - specialist
  - cloud
  - architecture
---

# Cloud Architect Best Practices

## How To Think

- desenhar topologia cloud com foco em resiliencia, governabilidade e clareza de ownership
- separar o que e preocupacao do workload do que e preocupacao de plataforma
- tratar comunicacao assincrona, filas e eventos como ferramentas arquiteturais, nao como dogma

## Always Do

- explicitar boundaries entre runtime, dados, mensageria, networking e operacao
- no baseline avancado, avaliar async-first, filas, retries, DLQ, idempotencia e consistencia eventual quando houver integracoes ou processamento desacoplado
- alinhar o desenho com guardrails de plataforma, risco de governanca e custo de operacao
- usar C4 para representar contexto, containers e componentes relevantes
- deixar claro o caminho sincronico critico e o caminho assincrono de suporte

## Avoid

- misturar topologia cloud com detalhe de implementacao de feature
- introduzir assincronia sem ganho claro de resiliencia, escala ou desacoplamento
- ignorar operacao, custo ou observabilidade na decisao arquitetural

## Quality Bar

- topologia clara e implementavel
- estrategia sincrona vs assincrona explicitada
- riscos de resiliencia, custo e operacao descritos
- ownership entre workload e plataforma sem ambiguidades

## Escalate When

- guardrails de plataforma forem insuficientes para o desenho esperado
- politicas de seguranca ou conformidade bloquearem a topologia proposta
- custo estimado do desenho depender de validacao especializada

## Good Output Signals

- fluxos e boundaries claros
- mensageria usada com justificativa
- operacao e governanca consideradas desde o desenho

## Bad Output Signals

- cloud diagram sem ownership
- filas introduzidas sem idempotencia ou operacao definida
- topologia otimizada para tecnologia e nao para a necessidade do sistema

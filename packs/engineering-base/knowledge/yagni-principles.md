---
schema: looply/knowledge@v1
name: yagni-principles
summary: YAGNI principles for code output — build the smallest thing that delivers the approved scope
audience:
  - backend
  - frontend
  - architect
  - reviewer
  - platform-engineer
  - devops
tags:
  - yagni
  - simplicity
  - code-quality
---

# YAGNI Principles

## Purpose

Manter o output de codigo aderente ao escopo aprovado, evitando abstracao, generalidade, configuracao e codigo especulativo que nao tem call-site real hoje.

## Core Rule

Entregue apenas o que a story, o tech spec e os contratos exigem agora. Adicione complexidade quando a terceira ocorrencia real aparecer, nao antes.

## Guidance

- nao criar parametro opcional, option bag ou flag sem pelo menos um call-site que o usa com valor diferente do default
- nao criar interface, classe abstrata, factory ou wrapper com uma unica implementacao concreta
- nao extrair helper generico antes da terceira ocorrencia real e concreta do mesmo padrao
- nao introduzir camada de indirecao que apenas repassa a chamada para outra funcao
- nao adicionar handler de erro para branch impossivel ja garantido pelo tipo, schema ou contrato de entrada
- nao introduzir feature flag, gate ou config sem consumidor real no mesmo recorte
- nao manter backwards compatibility shims sem consumidor vivo documentado
- nao escrever codigo para suposto requisito futuro; registrar a hipotese no follow-up e voltar quando houver pressao real
- nao adicionar dependencia, persistencia ou integracao sem justificar impacto no escopo atual
- remover exports, parametros, flags e branches mortos quando estiverem no escopo da mudanca

## Applies Differently To

- **fronteira de sistema** (input de usuario, API externa, payload de terceiro): validacao explicita e defensiva continua sendo obrigatoria — YAGNI nao enfraquece validacao de borda
- **codigo interno** (consumidores sob o mesmo controle): confie em tipos, contratos e invariantes; nao revalide o que o sistema ja garante
- **plataforma compartilhada**: um segundo consumidor hipotetico nao justifica generalizacao; espere o segundo consumidor real antes de abstrair

## Review Checklist

- todo parametro opcional tem consumidor que o usa diferente do default?
- toda funcao exportada e importada fora do proprio modulo?
- toda flag de CLI, option ou config e efetivamente consumida no fluxo?
- toda interface tem mais de uma implementacao real?
- existe duplicacao literal que justifica extrair helper (regra de tres)?
- ha branch ou handler cobrindo caso que o tipo ou schema ja impede?

## Examples

- bom sinal: 3 linhas parecidas mantidas inline ate a terceira ocorrencia real
- mau sinal: helper generico criado no primeiro uso "para reutilizar depois"
- bom sinal: funcao recebe so os parametros que o unico call-site precisa
- mau sinal: option bag com 6 campos, 5 deles sempre no default em todos os usos
- bom sinal: validacao explicita no controller que recebe payload externo
- mau sinal: validacao defensiva em caso de uso interno chamado apenas por codigo tipado
- bom sinal: branch removido junto com a flag que ninguem usa mais
- mau sinal: fallback silencioso mascarando erro de integracao real

## Bad Output Signals

- parametros opcionais nunca exercitados
- wrappers de uma linha que so repassam argumentos
- arquivos fragmentados por tipo tecnico antes do caso concreto
- tipos ou schemas com campos sem leitor
- refactor amplo empacotado junto com entrega funcional pequena
- abstracao justificada apenas por "pode vir a ser util"

## References

- `coding-standards`
- `architecture-principles`

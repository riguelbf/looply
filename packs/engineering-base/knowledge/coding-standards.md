---
schema: looply/knowledge@v1
name: coding-standards
summary: Shared coding expectations for implementation tasks
audience:
  - backend
  - reviewer
tags:
  - code
  - standards
---

# Coding Standards

## Purpose

Definir regras minimas de implementacao para manter mudancas pequenas, legiveis e seguras ao longo do repositorio.

## Guidance

- manter escopo minimo da mudanca e evitar refactor paralelo sem necessidade
- preferir nomes e estruturas alinhados com o modulo existente antes de introduzir novas abstracoes
- tornar fluxos explicitos: entrada, validacao, execucao, saida e tratamento de erro
- isolar side effects e integracoes em fronteiras claras
- nao duplicar regra de negocio; extrair para um ponto canonico quando ela ja existir em mais de um lugar
- atualizar testes quando comportamento, contrato ou fluxo operacional mudar
- registrar decisoes nao obvias no codigo, no spec ou no resumo de implementacao
- remover caminhos mortos, flags abandonadas e codigo parcialmente migrado quando estiverem no escopo da mudanca

## Examples

- bom sinal: handler fino, validacao de entrada explicita e caso de uso isolado
- mau sinal: endpoint com regra de negocio, acesso a banco e formatacao de resposta misturados no mesmo bloco
- bom sinal: nome de funcao orientado ao comportamento de dominio
- mau sinal: util generico criado cedo demais sem segundo caso real de uso

## References

- `architecture-principles`
- `backend-best-practices`

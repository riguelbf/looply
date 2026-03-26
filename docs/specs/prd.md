# Product Requirements Document

## Product

LOOPLY e uma plataforma para estruturar e distribuir conhecimento operacional de engenharia assistida por IA.

## Problem

O uso de IA em engenharia normalmente nasce em prompts soltos, com baixa padronizacao, pouca governanca e dificil reuso entre pessoas, times e dominios.

## Goal

Permitir que times publiquem e evoluam artefatos reutilizaveis de engenharia em Markdown, consumiveis por hosts como Codex e Claude Code.

## Core Outcomes

- agents com fronteiras claras
- tasks reutilizaveis
- workflows com handoff explicito
- squads como pacotes de dominio
- knowledge versionada
- instalacao global ou por projeto
- sync incremental preservando customizacoes locais

## Non Goals for v1

- runtime proprio de task/workflow
- execucao nativa de LLM
- marketplace publico
- automacao autonoma multiagente

## Primary Users

- engenheiro de software
- arquiteto
- tech lead
- QA
- especialista de dominio

## Distribution Model

LOOPLY mantem um modelo canonico proprio e o publica para os hosts suportados.

## MVP

O MVP esta pronto quando:

- existe um pack `engineering-base`
- ele pode ser validado
- ele pode ser instalado em escopo global ou por projeto
- ele pode ser sincronizado sem perder customizacao local
- os hosts conseguem carregar os artefatos publicados

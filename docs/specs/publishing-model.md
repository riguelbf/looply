# Publishing Model

## Canonical Source

O source of truth do LOOPLY e sempre o modelo canonico dentro do proprio repositorio.

## Host Publishing

A publicacao para um host tem tres camadas:

1. `managed`
2. `custom`
3. `entrypoints`

## Installed Layout

Estrutura recomendada no destino:

```text
.looply/
  managed/
    packs/
    manifests/
  custom/
    agents/
    tasks/
    workflows/
    knowledge/
  state/
    install-manifest.json
```

## Host Entrypoints

O host recebe arquivos de entrada no formato que ele entende.

Esses arquivos:

- apontam para o conteudo gerenciado
- preservam espaco para customizacao local
- podem ser regenerados pelo sync

## Sync Strategy

Sync e baseado em ownership de arquivo:

- `managed`: sobrescrevivel pelo LOOPLY
- `mergeable`: requer politica de conciliacao
- `custom`: nunca sobrescrever

## Install Scopes

- `global`
- `project`

## Publication Guarantees

- nao sobrescrever customizacoes do usuario
- gerar manifesto com ownership
- permitir reexecucao idempotente

# Tools

Helpers de suporte incluidos no repositorio looply.

## Code Context .NET Helper

Projeto C# em `tools/code-context-dotnet-helper/` (`Looply.CodeContext.Dotnet.csproj`). Usado pelo comando `looply refresh-code-context` para analisar projetos .NET e extrair informacoes de estrutura (namespaces, classes, dependencias).

## Code Context Python Helper

Script Python em `tools/code-context-python-helper.py`. Usado pelo comando `looply refresh-code-context` para analisar projetos Python e extrair informacoes de estrutura (modulos, imports, classes).

## Uso

Os helpers sao invocados automaticamente pelo CLI durante a descoberta de contexto de codigo. Nao precisam ser executados manualmente. O comando relevante e:

```bash
looply refresh-code-context
```

#!/usr/bin/env python3

from __future__ import annotations

import ast
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path


IGNORED_DIRS = {
    ".git",
    ".idea",
    ".vscode",
    ".looply",
    ".claude",
    ".agents",
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
    ".turbo",
    ".vercel",
    ".pnpm-store",
    "vendor",
    "target",
    "bin",
    "obj",
    ".venv",
    "venv",
    "__pycache__",
}

ENTRYPOINT_FILES = {"main.py", "app.py", "__main__.py"}


@dataclass
class Options:
    workspace_root: Path


def main(argv: list[str]) -> int:
    options = parse_arguments(argv)
    result = analyze_workspace(options.workspace_root)
    json.dump(result, sys.stdout, separators=(",", ":"))
    return 0


def parse_arguments(argv: list[str]) -> Options:
    workspace_root: Path | None = None

    index = 0
    while index < len(argv):
        if argv[index] == "--workspace-root" and index + 1 < len(argv):
            workspace_root = Path(argv[index + 1]).resolve()
            index += 2
            continue
        index += 1

    if workspace_root is None:
        raise ValueError("Missing --workspace-root")

    return Options(workspace_root=workspace_root)


def analyze_workspace(workspace_root: Path) -> dict[str, object]:
    files = sorted(iter_python_files(workspace_root))
    file_entries: list[str] = []
    symbols: list[dict[str, object]] = []
    relations: list[dict[str, str]] = []
    entrypoints: list[dict[str, object]] = []
    diagnostics: list[dict[str, str]] = []

    for file_path in files:
        relative_file = file_path.relative_to(workspace_root).as_posix()
        file_entries.append(relative_file)

        try:
            source = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError as error:
            diagnostics.append(
                {
                    "Severity": "warning",
                    "Message": f"{relative_file}: could not decode file as UTF-8 ({error})",
                }
            )
            continue

        try:
            tree = ast.parse(source, filename=str(file_path))
            compile(source, str(file_path), "exec")
        except SyntaxError as error:
            diagnostics.append(
                {
                    "Severity": "error",
                    "Message": f"{relative_file}:{error.lineno}:{error.offset}: {error.msg}",
                }
            )
            continue

        file_symbols, file_relations, file_entrypoint_symbols = analyze_module(relative_file, tree)
        symbols.extend(file_symbols)
        relations.extend(file_relations)

        if file_path.name in ENTRYPOINT_FILES or has_main_guard(tree):
            entrypoints.append(
                {
                    "File": relative_file,
                    "Symbols": file_entrypoint_symbols,
                }
            )

    return {
        "Files": file_entries,
        "Symbols": symbols,
        "Relations": relations,
        "Entrypoints": entrypoints,
        "Diagnostics": diagnostics,
    }


def iter_python_files(workspace_root: Path) -> list[Path]:
    discovered: list[Path] = []
    for root, dirs, files in os.walk(workspace_root):
        dirs[:] = [directory for directory in dirs if directory not in IGNORED_DIRS]
        for file_name in files:
            if file_name.endswith(".py"):
                discovered.append(Path(root) / file_name)
    return discovered


def analyze_module(relative_file: str, tree: ast.Module) -> tuple[list[dict[str, object]], list[dict[str, str]], list[str]]:
    symbols: list[dict[str, object]] = []
    relations: list[dict[str, str]] = []
    entrypoint_symbols: list[str] = []

    for node in tree.body:
        if isinstance(node, ast.Import):
            for alias in node.names:
                relations.append({"Type": "imports", "From": relative_file, "To": alias.name})
            continue

        if isinstance(node, ast.ImportFrom):
            module_name = node.module or ""
            imported_names = ",".join(alias.name for alias in node.names if alias.name)
            target = module_name if imported_names == "" else f"{module_name}:{imported_names}"
            relations.append({"Type": "imports", "From": relative_file, "To": target})
            continue

        if isinstance(node, ast.ClassDef) and is_public_name(node.name):
            symbols.append(
                {
                    "Name": node.name,
                    "Kind": "class",
                    "File": relative_file,
                    "Exported": True,
                }
            )

            for member in node.body:
                if isinstance(member, (ast.FunctionDef, ast.AsyncFunctionDef)) and is_public_name(member.name):
                    symbols.append(
                        {
                            "Name": f"{node.name}.{member.name}",
                            "Kind": "method",
                            "File": relative_file,
                            "Exported": True,
                        }
                    )
            continue

        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and is_public_name(node.name):
            symbols.append(
                {
                    "Name": node.name,
                    "Kind": "function",
                    "File": relative_file,
                    "Exported": True,
                }
            )
            continue

        if isinstance(node, ast.If) and is_main_guard_test(node.test):
            for statement in node.body:
                callable_name = extract_callable_name(statement)
                if callable_name is not None:
                    entrypoint_symbols.append(callable_name)

    deduped_entrypoint_symbols = list(dict.fromkeys(entrypoint_symbols))
    return symbols, relations, deduped_entrypoint_symbols


def extract_callable_name(node: ast.stmt) -> str | None:
    if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
        return resolve_callable_name(node.value.func)
    if isinstance(node, ast.Assign) and isinstance(node.value, ast.Call):
        return resolve_callable_name(node.value.func)
    return None


def resolve_callable_name(node: ast.AST) -> str | None:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        base = resolve_callable_name(node.value)
        if base:
            return f"{base}.{node.attr}"
        return node.attr
    return None


def has_main_guard(tree: ast.Module) -> bool:
    return any(isinstance(node, ast.If) and is_main_guard_test(node.test) for node in tree.body)


def is_main_guard_test(node: ast.AST) -> bool:
    if not isinstance(node, ast.Compare):
        return False
    if len(node.ops) != 1 or len(node.comparators) != 1:
        return False
    if not isinstance(node.ops[0], ast.Eq):
        return False
    left = node.left
    right = node.comparators[0]
    return (
        isinstance(left, ast.Name)
        and left.id == "__name__"
        and isinstance(right, ast.Constant)
        and right.value == "__main__"
    )


def is_public_name(name: str) -> bool:
    return not name.startswith("_")


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

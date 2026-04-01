using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

var options = ParseArguments(args);
var result = await AnalyzeWorkspaceAsync(options);
Console.WriteLine(JsonSerializer.Serialize(result));

static async Task<DotnetAnalysisResult> AnalyzeWorkspaceAsync(AnalysisOptions options)
{
    var workspaceRoot = Path.GetFullPath(options.WorkspaceRoot);
    var files = Directory.GetFiles(workspaceRoot, "*.cs", SearchOption.AllDirectories)
        .Where(file => IsUnder(workspaceRoot, file))
        .OrderBy(file => file, StringComparer.Ordinal)
        .ToList();

    if (files.Count == 0)
    {
        return new DotnetAnalysisResult([], [], [], [], []);
    }

    var syntaxTrees = new List<SyntaxTree>();
    var relativeFiles = new Dictionary<SyntaxTree, string>();

    foreach (var file in files)
    {
        var source = await File.ReadAllTextAsync(file);
        var tree = CSharpSyntaxTree.ParseText(source, path: file);
        syntaxTrees.Add(tree);
        relativeFiles[tree] = ToRelative(workspaceRoot, file);
    }

    var hasTopLevelStatements = syntaxTrees
        .Select(tree => tree.GetRoot())
        .Any(root => root.DescendantNodes().OfType<GlobalStatementSyntax>().Any());

    var compilationTrees = new List<SyntaxTree>(syntaxTrees)
    {
        CSharpSyntaxTree.ParseText(
            """
            global using System;
            global using System.Collections.Generic;
            global using System.IO;
            global using System.Linq;
            global using System.Net.Http;
            global using System.Threading;
            global using System.Threading.Tasks;
            """,
            path: "__looply_implicit_usings__.g.cs")
    };

    var compilation = CSharpCompilation.Create(
        assemblyName: "Looply.CodeContext.Dotnet.Workspace",
        syntaxTrees: compilationTrees,
        references: ResolveMetadataReferences(),
        options: new CSharpCompilationOptions(
            hasTopLevelStatements ? OutputKind.ConsoleApplication : OutputKind.DynamicallyLinkedLibrary));

    var symbols = new List<SymbolItem>();
    var relations = new List<RelationItem>();
    var entrypoints = new List<EntrypointItem>();

    foreach (var tree in syntaxTrees)
    {
        var relativeFile = relativeFiles[tree];
        var root = await tree.GetRootAsync();
        var semanticModel = compilation.GetSemanticModel(tree, ignoreAccessibility: true);

        var symbolSet = new HashSet<string>(StringComparer.Ordinal);
        var entrypointSymbols = new List<string>();

        foreach (var node in root.DescendantNodes())
        {
            if (node is BaseTypeDeclarationSyntax typeDeclaration)
            {
                var declaredSymbol = semanticModel.GetDeclaredSymbol(typeDeclaration);
                if (declaredSymbol is INamedTypeSymbol namedType && namedType.DeclaredAccessibility == Accessibility.Public)
                {
                    if (symbolSet.Add(namedType.Name))
                    {
                        symbols.Add(new SymbolItem(namedType.Name, MapTypeKind(namedType), relativeFile, true));
                    }
                }
            }

            if (node is MethodDeclarationSyntax methodDeclaration)
            {
                var methodSymbol = semanticModel.GetDeclaredSymbol(methodDeclaration);
                if (methodSymbol is IMethodSymbol method &&
                    method.DeclaredAccessibility == Accessibility.Public &&
                    method.ContainingType?.DeclaredAccessibility == Accessibility.Public)
                {
                    var name = $"{method.ContainingType.Name}.{method.Name}";
                    if (symbolSet.Add(name))
                    {
                        symbols.Add(new SymbolItem(name, "method", relativeFile, true));
                    }
                }
            }

            if (node is UsingDirectiveSyntax usingDirective)
            {
                var target = usingDirective.Name?.ToString();
                if (!string.IsNullOrWhiteSpace(target))
                {
                    relations.Add(new RelationItem("uses-namespace", relativeFile, target));
                }
            }

            if (node is GlobalStatementSyntax && !entrypointSymbols.Contains("Program"))
            {
                entrypointSymbols.Add("Program");
            }
        }

        foreach (var type in root.DescendantNodes().OfType<TypeDeclarationSyntax>())
        {
            foreach (var method in type.Members.OfType<MethodDeclarationSyntax>())
            {
                if (method.Identifier.Text == "Main" &&
                    method.Modifiers.Any(modifier => modifier.IsKind(SyntaxKind.StaticKeyword)))
                {
                    var symbolName = $"{type.Identifier.Text}.Main";
                    if (!entrypointSymbols.Contains(symbolName))
                    {
                        entrypointSymbols.Add(symbolName);
                    }
                }
            }
        }

        if (Path.GetFileName(tree.FilePath).Equals("Program.cs", StringComparison.OrdinalIgnoreCase) && !entrypointSymbols.Contains("Program"))
        {
            entrypointSymbols.Add("Program");
        }

        if (entrypointSymbols.Count > 0)
        {
            entrypoints.Add(new EntrypointItem(relativeFile, entrypointSymbols));
        }
    }

    var diagnostics = compilation.GetDiagnostics()
        .Where(diagnostic => diagnostic.Location.SourceTree is not null)
        .Where(diagnostic => diagnostic.Severity != DiagnosticSeverity.Hidden)
        .Select(diagnostic => new DiagnosticItem(
            diagnostic.Severity switch
            {
                DiagnosticSeverity.Error => "error",
                DiagnosticSeverity.Warning => "warning",
                _ => "info"
            },
            diagnostic.ToString()))
        .ToList();

    var distinctFiles = relativeFiles.Values
        .Distinct(StringComparer.Ordinal)
        .OrderBy(file => file, StringComparer.Ordinal)
        .ToList();

    return new DotnetAnalysisResult(distinctFiles, symbols, relations, entrypoints, diagnostics);
}

static List<MetadataReference> ResolveMetadataReferences()
{
    var trustedPlatformAssemblies = (string?)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES");
    if (string.IsNullOrWhiteSpace(trustedPlatformAssemblies))
    {
        return [];
    }

    return trustedPlatformAssemblies
        .Split(Path.PathSeparator)
        .Where(path => !string.IsNullOrWhiteSpace(path))
        .Where(path =>
        {
            var fileName = Path.GetFileName(path);
            return fileName is "mscorlib.dll" or "netstandard.dll"
                || fileName.StartsWith("System.", StringComparison.Ordinal)
                || fileName.StartsWith("Microsoft.", StringComparison.Ordinal);
        })
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .Select(assemblyPath => MetadataReference.CreateFromFile(assemblyPath))
        .Cast<MetadataReference>()
        .ToList();
}

static string MapTypeKind(INamedTypeSymbol symbol) => symbol.TypeKind switch
{
    TypeKind.Class => "class",
    TypeKind.Interface => "interface",
    TypeKind.Enum => "enum",
    TypeKind.Struct => "struct",
    _ => "type"
};

static bool IsUnder(string root, string candidate)
{
    var relative = Path.GetRelativePath(root, candidate);
    return !relative.StartsWith("..", StringComparison.Ordinal) && !Path.IsPathRooted(relative);
}

static string ToRelative(string root, string filePath)
{
    return Path.GetRelativePath(root, filePath).Replace(Path.DirectorySeparatorChar, '/');
}

static AnalysisOptions ParseArguments(string[] args)
{
    string? workspaceRoot = null;

    for (var i = 0; i < args.Length; i += 1)
    {
        if (args[i] == "--workspace-root" && i + 1 < args.Length)
        {
            workspaceRoot = args[i + 1];
            i += 1;
        }
    }

    if (string.IsNullOrWhiteSpace(workspaceRoot))
    {
        throw new ArgumentException("Missing --workspace-root");
    }

    return new AnalysisOptions(workspaceRoot);
}

internal sealed record AnalysisOptions(string WorkspaceRoot);
internal sealed record DotnetAnalysisResult(
    List<string> Files,
    List<SymbolItem> Symbols,
    List<RelationItem> Relations,
    List<EntrypointItem> Entrypoints,
    List<DiagnosticItem> Diagnostics);
internal sealed record SymbolItem(string Name, string Kind, string File, bool Exported);
internal sealed record RelationItem(string Type, string From, string To);
internal sealed record EntrypointItem(string File, List<string> Symbols);
internal sealed record DiagnosticItem(string Severity, string Message);

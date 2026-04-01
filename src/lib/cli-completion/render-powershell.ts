export function renderPowerShellCompletion(): string {
  return `$script:LooplyCompletionScriptBlock = {
  param($wordToComplete, $commandAst, $cursorPosition)

  $tokens = @()
  foreach ($element in ($commandAst.CommandElements | Select-Object -Skip 1)) {
    $tokens += $element.Extent.Text
  }

  if ($wordToComplete -eq "") {
    $tokens += ""
  } elseif ($tokens.Count -eq 0 -or $tokens[-1] -ne $wordToComplete) {
    $tokens += $wordToComplete
  }

  $index = $tokens.Count
  $suggestions = & looply __complete --shell powershell --index $index --current-word $wordToComplete -- @tokens 2>$null

  foreach ($suggestion in $suggestions) {
    $parts = $suggestion -split "\`t", 2
    $value = $parts[0]
    $tooltip = if ($parts.Count -gt 1) { $parts[1] } else { $value }
    [System.Management.Automation.CompletionResult]::new($value, $value, 'ParameterValue', $tooltip)
  }
}

Register-ArgumentCompleter -Native -CommandName looply -ScriptBlock $script:LooplyCompletionScriptBlock
`;
}

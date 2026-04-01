export function renderZshCompletion(): string {
  return `#compdef looply

_looply_completion() {
  local -a suggestions
  suggestions=("\${(@f)$(looply __complete --shell zsh --index "$CURRENT" -- "\${words[@]:1}")}")
  _describe 'values' suggestions
}

compdef _looply_completion looply
`;
}

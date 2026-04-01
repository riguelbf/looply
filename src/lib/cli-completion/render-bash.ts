export function renderBashCompletion(): string {
  return `# bash completion for looply
_looply_completion() {
  local cur prev cword
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  cword="$COMP_CWORD"

  local suggestions
  suggestions="$(looply __complete --shell bash --index "$cword" -- "\${COMP_WORDS[@]:1}")"
  if [[ $? -ne 0 ]]; then
    return 0
  fi

  COMPREPLY=( $(compgen -W "$suggestions" -- "$cur") )
}

complete -F _looply_completion looply
`;
}

import chalk from "chalk";

export function renderLogo(): string {
  return [
    chalk.cyan(" _     _       _           "),
    chalk.cyan("| |   | | __ _(_)_ __  ___ "),
    chalk.blue("| |   | |/ _` | | '_ \\/ __|"),
    chalk.blue("| |___| | (_| | | | | \\__ \\"),
    chalk.magenta("|_____|_|\\__,_|_|_| |_|___/")
  ].join("\n");
}

export function renderTagline(): string {
  return chalk.dim("artifact platform for engineering AI workflows");
}

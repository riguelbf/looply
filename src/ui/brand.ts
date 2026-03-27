import chalk from "chalk";

export function renderLogo(): string {
  return [
    chalk.hex("#C084FC")(" _     ___   ___  ____  _    __   __"),
    chalk.hex("#7C3AED")("| |   / _ \\ / _ \\|  _ \\| |   \\ \\ / /"),
    chalk.hex("#2563EB")("| |  | | | | | | | |_) | |    \\ V / "),
    chalk.hex("#22D3EE")("| |__| |_| | |_| |  __/| |___  | |  "),
    chalk.hex("#F9FAFB")("|_____\\___/ \\___/|_|   |_____| |_|  ")
  ].join("\n");
}

export function renderTagline(): string {
  return chalk.dim("artifact platform for engineering AI workflows");
}

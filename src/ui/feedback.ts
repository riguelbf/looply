import { intro, outro, spinner } from "@clack/prompts";
import chalk from "chalk";

export function showIntro(title: string): void {
  intro(chalk.bold(title));
}

export function showOutro(message: string): void {
  outro(chalk.green(message));
}

export function createSpinner(message: string) {
  const loading = spinner();
  loading.start(message);
  return {
    stop(successMessage: string) {
      loading.stop(chalk.green(successMessage));
    }
  };
}

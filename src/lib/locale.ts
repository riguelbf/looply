import path from "node:path";
import fs from "fs-extra";
import type { OutputLocale } from "./host-publisher.js";

export interface LocaleDocument {
  outputLocale: OutputLocale;
  fallbackLocale: "en";
}

export function resolveLocaleFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "locale.json");
}

export async function writeLocaleFile(targetRoot: string, locale: OutputLocale): Promise<string> {
  const localeFile = resolveLocaleFile(targetRoot);
  await fs.ensureDir(path.dirname(localeFile));
  await fs.writeJson(localeFile, {
    outputLocale: locale,
    fallbackLocale: "en"
  } satisfies LocaleDocument, { spaces: 2 });
  return localeFile;
}

export async function readLocaleFile(targetRoot: string): Promise<LocaleDocument | null> {
  const localeFile = resolveLocaleFile(targetRoot);
  if (!(await fs.pathExists(localeFile))) {
    return null;
  }

  const raw = await fs.readJson(localeFile);
  const outputLocale = raw?.outputLocale === "pt-BR" ? "pt-BR" : raw?.outputLocale === "en" ? "en" : null;
  if (!outputLocale) {
    return null;
  }

  return {
    outputLocale,
    fallbackLocale: "en"
  };
}

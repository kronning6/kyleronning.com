import { cacheLife } from "next/cache";
import { codeToHtml } from "shiki";

const SHIKI_THEMES = {
  light: "catppuccin-latte",
  dark: "catppuccin-frappe",
} as const;

const NOTION_LANGUAGE_ALIASES: Record<string, string> = {
  "c#": "csharp",
  "c++": "cpp",
  docker: "dockerfile",
  "f#": "fsharp",
  plaintext: "text",
  "plain text": "text",
  shell: "bash",
  "vb.net": "vb",
};

function normalizeLanguage(language: string) {
  const normalized = language.trim().toLowerCase();

  return NOTION_LANGUAGE_ALIASES[normalized] ?? normalized;
}

export async function highlightCodeBlock(code: string, language: string) {
  "use cache";
  cacheLife("max");

  const normalizedLanguage = normalizeLanguage(language);

  try {
    return await codeToHtml(code, {
      lang: normalizedLanguage,
      themes: SHIKI_THEMES,
    });
  } catch {
    return codeToHtml(code, {
      lang: "text",
      themes: SHIKI_THEMES,
    });
  }
}

import type { Theme } from '../types/theme';
import { DEFAULT_TOKENS } from './defaultTokens';

const STORAGE_KEY = 'theme-studio-themes';
const CURRENT_SCHEMA_VERSION = 1;

export function saveTheme(theme: Theme): void {
  const themes = loadAllThemes();
  const index = themes.findIndex((t) => t.id === theme.id);
  const updated = { ...theme, updatedAt: new Date().toISOString() };

  const next =
    index >= 0
      ? themes.map((t, i) => (i === index ? updated : t))
      : [...themes, updated];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function loadTheme(): Theme | null {
  const themes = loadAllThemes();
  return themes.length > 0 ? themes[0] : null;
}

export function loadAllThemes(): Theme[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateTheme);
  } catch {
    return [];
  }
}

export function deleteTheme(id: string): void {
  const themes = loadAllThemes();
  const filtered = themes.filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function migrateTheme(raw: unknown): Theme {
  if (typeof raw !== 'object' || raw === null) {
    return createDefaultTheme();
  }

  const obj = raw as Record<string, unknown>;

  const id = typeof obj.id === 'string' ? obj.id : crypto.randomUUID();
  const name = typeof obj.name === 'string' ? obj.name : 'Untitled Theme';
  const schemaVersion =
    typeof obj.schemaVersion === 'number' ? obj.schemaVersion : 0;
  const createdAt =
    typeof obj.createdAt === 'string'
      ? obj.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof obj.updatedAt === 'string'
      ? obj.updatedAt
      : new Date().toISOString();
  const activeVariant =
    obj.activeVariant === 'light' || obj.activeVariant === 'dark'
      ? obj.activeVariant
      : 'light';

  let tokens = DEFAULT_TOKENS;

  if (schemaVersion >= 1 && typeof obj.tokens === 'object' && obj.tokens) {
    const tokensObj = obj.tokens as Record<string, unknown>;
    tokens = {
      light: mergeVariantTokens(tokensObj.light, DEFAULT_TOKENS.light),
      dark: mergeVariantTokens(tokensObj.dark, DEFAULT_TOKENS.dark),
    };
  }

  return {
    id,
    name,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt,
    updatedAt,
    activeVariant,
    tokens,
  };
}

function mergeVariantTokens(
  saved: unknown,
  defaults: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  if (typeof saved !== 'object' || saved === null) return { ...defaults };

  const savedObj = saved as Record<string, unknown>;
  const result: Record<string, Record<string, string>> = {};

  for (const [category, defaultValues] of Object.entries(defaults)) {
    const savedCategory = savedObj[category];
    if (typeof savedCategory === 'object' && savedCategory !== null) {
      result[category] = {
        ...defaultValues,
        ...(savedCategory as Record<string, string>),
      };
    } else {
      result[category] = { ...defaultValues };
    }
  }

  return result;
}

export function createDefaultTheme(): Theme {
  return {
    id: crypto.randomUUID(),
    name: 'Default Theme',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeVariant: 'light',
    tokens: structuredClone(DEFAULT_TOKENS),
  };
}

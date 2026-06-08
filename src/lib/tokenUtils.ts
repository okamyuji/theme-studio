import type { TokenCategory, TokenValues } from '../types/theme';

const TOKEN_CATEGORIES: readonly TokenCategory[] = [
  'colors',
  'typography',
  'shapes',
  'spacing',
];

export function flattenTokens(
  tokens: Record<TokenCategory, TokenValues>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const category of TOKEN_CATEGORIES) {
    const values = tokens[category];
    if (values) {
      for (const [key, value] of Object.entries(values)) {
        result[key] = value;
      }
    }
  }
  return result;
}

export function unflattenTokens(
  flat: Record<string, string>,
): Record<TokenCategory, TokenValues> {
  const result: Record<TokenCategory, TokenValues> = {
    colors: {},
    typography: {},
    shapes: {},
    spacing: {},
  };

  for (const [key, value] of Object.entries(flat)) {
    if (key.startsWith('--color-')) {
      result.colors[key] = value;
    } else if (key.startsWith('--font-') || key.startsWith('--line-height-')) {
      result.typography[key] = value;
    } else if (
      key.startsWith('--radius-') ||
      key.startsWith('--shadow-') ||
      key.startsWith('--shape-')
    ) {
      result.shapes[key] = value;
    } else if (key.startsWith('--spacing-')) {
      result.spacing[key] = value;
    }
  }

  return result;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;

  const num = parseInt(expanded, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const srgb = c / 255;
    return srgb <= 0.04045
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(fg: string, bg: string): number {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);
  const fgLum = relativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getWcagLevel(
  ratio: number,
  isLargeText: boolean,
): 'AAA' | 'AA' | 'fail' {
  if (isLargeText) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA';
    return 'fail';
  }
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'fail';
}

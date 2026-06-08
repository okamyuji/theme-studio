import { describe, it, expect } from 'vitest';
import {
  flattenTokens,
  unflattenTokens,
  hexToRgb,
  relativeLuminance,
  getContrastRatio,
  getWcagLevel,
} from './tokenUtils';
import type { TokenCategory, TokenValues } from '../types/theme';

describe('flattenTokens', () => {
  it('flattens all categories into a single record', () => {
    const tokens: Record<TokenCategory, TokenValues> = {
      colors: { '--color-primary': '#4F46E5' },
      typography: { '--font-size-base': '1rem' },
      shapes: { '--radius-md': '8px' },
      spacing: { '--spacing-md': '16px' },
    };

    const flat = flattenTokens(tokens);
    expect(flat).toEqual({
      '--color-primary': '#4F46E5',
      '--font-size-base': '1rem',
      '--radius-md': '8px',
      '--spacing-md': '16px',
    });
  });

  it('returns empty object for empty categories', () => {
    const tokens: Record<TokenCategory, TokenValues> = {
      colors: {},
      typography: {},
      shapes: {},
      spacing: {},
    };

    expect(flattenTokens(tokens)).toEqual({});
  });
});

describe('unflattenTokens', () => {
  it('sorts tokens into correct categories', () => {
    const flat = {
      '--color-primary': '#4F46E5',
      '--font-size-base': '1rem',
      '--line-height-normal': '1.5',
      '--radius-md': '8px',
      '--shadow-sm': '0 1px 2px rgba(0,0,0,0.05)',
      '--shape-opacity': '1',
      '--spacing-md': '16px',
    };

    const result = unflattenTokens(flat);
    expect(result.colors['--color-primary']).toBe('#4F46E5');
    expect(result.typography['--font-size-base']).toBe('1rem');
    expect(result.typography['--line-height-normal']).toBe('1.5');
    expect(result.shapes['--radius-md']).toBe('8px');
    expect(result.shapes['--shadow-sm']).toBe('0 1px 2px rgba(0,0,0,0.05)');
    expect(result.shapes['--shape-opacity']).toBe('1');
    expect(result.spacing['--spacing-md']).toBe('16px');
  });
});

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('parses 3-digit shorthand hex', () => {
    expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('parses hex without hash', () => {
    expect(hexToRgb('4F46E5')).toEqual({ r: 79, g: 70, b: 229 });
  });
});

describe('relativeLuminance', () => {
  it('returns 0 for black', () => {
    expect(relativeLuminance(0, 0, 0)).toBe(0);
  });

  it('returns 1 for white', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 4);
  });

  it('returns correct luminance for mid-gray', () => {
    const lum = relativeLuminance(128, 128, 128);
    expect(lum).toBeGreaterThan(0.2);
    expect(lum).toBeLessThan(0.3);
  });
});

describe('getContrastRatio', () => {
  it('returns 21:1 for black on white', () => {
    const ratio = getContrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1:1 for same colors', () => {
    const ratio = getContrastRatio('#4F46E5', '#4F46E5');
    expect(ratio).toBeCloseTo(1, 2);
  });

  it('is order-independent (fg and bg can swap)', () => {
    const r1 = getContrastRatio('#000000', '#FFFFFF');
    const r2 = getContrastRatio('#FFFFFF', '#000000');
    expect(r1).toBeCloseTo(r2, 2);
  });
});

describe('getWcagLevel', () => {
  describe('normal text', () => {
    it('returns AAA for ratio >= 7', () => {
      expect(getWcagLevel(7, false)).toBe('AAA');
      expect(getWcagLevel(10, false)).toBe('AAA');
    });

    it('returns AA for ratio >= 4.5 but < 7', () => {
      expect(getWcagLevel(4.5, false)).toBe('AA');
      expect(getWcagLevel(6.9, false)).toBe('AA');
    });

    it('returns fail for ratio < 4.5', () => {
      expect(getWcagLevel(4.4, false)).toBe('fail');
      expect(getWcagLevel(1, false)).toBe('fail');
    });
  });

  describe('large text', () => {
    it('returns AAA for ratio >= 4.5', () => {
      expect(getWcagLevel(4.5, true)).toBe('AAA');
      expect(getWcagLevel(7, true)).toBe('AAA');
    });

    it('returns AA for ratio >= 3 but < 4.5', () => {
      expect(getWcagLevel(3, true)).toBe('AA');
      expect(getWcagLevel(4.4, true)).toBe('AA');
    });

    it('returns fail for ratio < 3', () => {
      expect(getWcagLevel(2.9, true)).toBe('fail');
    });
  });
});

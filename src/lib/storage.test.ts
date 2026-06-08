import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveTheme,
  loadTheme,
  loadAllThemes,
  deleteTheme,
  migrateTheme,
  createDefaultTheme,
} from './storage';
import type { Theme } from '../types/theme';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function makeTheme(overrides: Partial<Theme> = {}): Theme {
    return {
      ...createDefaultTheme(),
      ...overrides,
    };
  }

  describe('saveTheme', () => {
    it('saves a new theme', () => {
      const theme = makeTheme({ id: 'test-1', name: 'Test' });
      saveTheme(theme);

      const loaded = loadAllThemes();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('test-1');
    });

    it('updates an existing theme by id', () => {
      const theme = makeTheme({ id: 'test-1', name: 'Original' });
      saveTheme(theme);
      saveTheme({ ...theme, name: 'Updated' });

      const loaded = loadAllThemes();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Updated');
    });
  });

  describe('loadTheme', () => {
    it('returns null when no themes saved', () => {
      expect(loadTheme()).toBeNull();
    });

    it('returns the first theme', () => {
      saveTheme(makeTheme({ id: 'first' }));
      saveTheme(makeTheme({ id: 'second' }));

      const loaded = loadTheme();
      expect(loaded?.id).toBe('first');
    });
  });

  describe('loadAllThemes', () => {
    it('returns empty array for corrupt data', () => {
      localStorage.setItem('theme-studio-themes', 'not-json');
      expect(loadAllThemes()).toEqual([]);
    });

    it('returns empty array for non-array data', () => {
      localStorage.setItem('theme-studio-themes', '{"foo": "bar"}');
      expect(loadAllThemes()).toEqual([]);
    });
  });

  describe('deleteTheme', () => {
    it('removes a theme by id', () => {
      saveTheme(makeTheme({ id: 'keep' }));
      saveTheme(makeTheme({ id: 'remove' }));

      deleteTheme('remove');
      const loaded = loadAllThemes();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('keep');
    });
  });

  describe('migrateTheme', () => {
    it('returns default theme for null input', () => {
      const result = migrateTheme(null);
      expect(result.schemaVersion).toBe(1);
      expect(result.tokens.light.colors['--color-primary']).toBeDefined();
    });

    it('returns default theme for non-object input', () => {
      const result = migrateTheme('invalid');
      expect(result.schemaVersion).toBe(1);
    });

    it('preserves valid fields and fills missing ones', () => {
      const result = migrateTheme({
        id: 'custom-id',
        name: 'Custom',
        schemaVersion: 1,
        tokens: {
          light: {
            colors: { '--color-primary': '#FF0000' },
          },
          dark: {},
        },
      });

      expect(result.id).toBe('custom-id');
      expect(result.name).toBe('Custom');
      expect(result.tokens.light.colors['--color-primary']).toBe('#FF0000');
      expect(result.tokens.light.colors['--color-secondary']).toBeDefined();
      expect(result.tokens.dark.colors['--color-primary']).toBeDefined();
    });

    it('handles missing schemaVersion as version 0', () => {
      const result = migrateTheme({ name: 'Old' });
      expect(result.schemaVersion).toBe(1);
      expect(result.tokens.light.colors).toBeDefined();
    });

    it('generates id when missing', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(
        'generated-uuid' as `${string}-${string}-${string}-${string}-${string}`,
      );
      const result = migrateTheme({ name: 'No ID' });
      expect(result.id).toBe('generated-uuid');
      vi.restoreAllMocks();
    });
  });
});

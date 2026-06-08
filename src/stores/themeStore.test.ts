import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({
      ...useThemeStore.getInitialState(),
    });
  });

  describe('updateToken', () => {
    it('updates a color token in the active variant', () => {
      useThemeStore
        .getState()
        .updateToken('colors', '--color-primary', '#FF0000');

      const { theme } = useThemeStore.getState();
      expect(theme.tokens.light.colors['--color-primary']).toBe('#FF0000');
    });

    it('only updates the active variant', () => {
      useThemeStore
        .getState()
        .updateToken('colors', '--color-primary', '#FF0000');

      const { theme } = useThemeStore.getState();
      expect(theme.tokens.dark.colors['--color-primary']).not.toBe('#FF0000');
    });

    it('pushes previous state to history', () => {
      useThemeStore
        .getState()
        .updateToken('colors', '--color-primary', '#FF0000');

      const { past } = useThemeStore.getState();
      expect(past).toHaveLength(1);
    });

    it('clears future on new edit', () => {
      const store = useThemeStore.getState();
      store.updateToken('colors', '--color-primary', '#FF0000');
      store.updateToken('colors', '--color-primary', '#00FF00');

      useThemeStore.getState().undo();
      useThemeStore
        .getState()
        .updateToken('colors', '--color-primary', '#0000FF');

      expect(useThemeStore.getState().future).toHaveLength(0);
    });
  });

  describe('setVariant', () => {
    it('switches the active variant', () => {
      useThemeStore.getState().setVariant('dark');
      expect(useThemeStore.getState().activeVariant).toBe('dark');
    });
  });

  describe('setDevice', () => {
    it('changes the selected device', () => {
      useThemeStore.getState().setDevice('pixel8');
      expect(useThemeStore.getState().selectedDevice).toBe('pixel8');
    });
  });

  describe('undo / redo', () => {
    it('undoes the last change', () => {
      const originalPrimary =
        useThemeStore.getState().theme.tokens.light.colors['--color-primary'];

      useThemeStore
        .getState()
        .updateToken('colors', '--color-primary', '#FF0000');
      expect(
        useThemeStore.getState().theme.tokens.light.colors['--color-primary'],
      ).toBe('#FF0000');

      useThemeStore.getState().undo();
      expect(
        useThemeStore.getState().theme.tokens.light.colors['--color-primary'],
      ).toBe(originalPrimary);
    });

    it('redoes an undone change', () => {
      useThemeStore
        .getState()
        .updateToken('colors', '--color-primary', '#FF0000');
      useThemeStore.getState().undo();
      useThemeStore.getState().redo();

      expect(
        useThemeStore.getState().theme.tokens.light.colors['--color-primary'],
      ).toBe('#FF0000');
    });

    it('does nothing when undo history is empty', () => {
      const before = useThemeStore.getState().theme;
      useThemeStore.getState().undo();
      expect(useThemeStore.getState().theme).toBe(before);
    });

    it('does nothing when redo history is empty', () => {
      const before = useThemeStore.getState().theme;
      useThemeStore.getState().redo();
      expect(useThemeStore.getState().theme).toBe(before);
    });

    it('limits history to 50 entries', () => {
      for (let i = 0; i < 55; i++) {
        useThemeStore
          .getState()
          .updateToken(
            'colors',
            '--color-primary',
            `#${String(i).padStart(6, '0')}`,
          );
      }
      expect(useThemeStore.getState().past.length).toBeLessThanOrEqual(50);
    });
  });

  describe('resetToDefaults', () => {
    it('restores default tokens while keeping id and name', () => {
      const { id, name } = useThemeStore.getState().theme;
      useThemeStore
        .getState()
        .updateToken('colors', '--color-primary', '#FF0000');
      useThemeStore.getState().resetToDefaults();

      const { theme } = useThemeStore.getState();
      expect(theme.id).toBe(id);
      expect(theme.name).toBe(name);
      expect(theme.tokens.light.colors['--color-primary']).toBe('#4F46E5');
    });
  });

  describe('loadTheme', () => {
    it('replaces current theme and clears history', () => {
      useThemeStore
        .getState()
        .updateToken('colors', '--color-primary', '#FF0000');

      const newTheme = {
        ...useThemeStore.getState().theme,
        id: 'loaded',
        name: 'Loaded',
        activeVariant: 'dark' as const,
      };

      useThemeStore.getState().loadTheme(newTheme);

      expect(useThemeStore.getState().theme.id).toBe('loaded');
      expect(useThemeStore.getState().activeVariant).toBe('dark');
      expect(useThemeStore.getState().past).toHaveLength(0);
      expect(useThemeStore.getState().future).toHaveLength(0);
    });
  });
});

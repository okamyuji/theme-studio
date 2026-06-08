import { create } from 'zustand';
import type {
  Theme,
  ThemeVariant,
  DeviceId,
  ConnectionState,
  TokenCategory,
} from '../types/theme';
import { createDefaultTheme } from '../lib/storage';

const MAX_HISTORY = 50;

interface ThemeState {
  theme: Theme;
  activeVariant: ThemeVariant;
  selectedDevice: DeviceId;
  connectionState: ConnectionState;
  targetUrl: string;

  past: Theme[];
  future: Theme[];

  updateToken: (category: TokenCategory, key: string, value: string) => void;
  setVariant: (variant: ThemeVariant) => void;
  setDevice: (device: DeviceId) => void;
  setTargetUrl: (url: string) => void;
  setConnectionState: (state: ConnectionState) => void;
  undo: () => void;
  redo: () => void;
  resetToDefaults: () => void;
  saveCurrentTheme: () => void;
  loadTheme: (theme: Theme) => void;
}

function pushHistory(past: Theme[], current: Theme): Theme[] {
  const next = [...past, current];
  if (next.length > MAX_HISTORY) {
    return next.slice(next.length - MAX_HISTORY);
  }
  return next;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: createDefaultTheme(),
  activeVariant: 'light',
  selectedDevice: 'iphone15pro',
  connectionState: 'disconnected',
  targetUrl: '',

  past: [],
  future: [],

  updateToken: (category, key, value) =>
    set((state) => {
      const variant = state.activeVariant;
      const currentTokens = state.theme.tokens[variant][category];
      const updatedTokens = { ...currentTokens, [key]: value };
      const updatedVariantTokens = {
        ...state.theme.tokens[variant],
        [category]: updatedTokens,
      };
      const updatedAllTokens = {
        ...state.theme.tokens,
        [variant]: updatedVariantTokens,
      };
      const updatedTheme: Theme = {
        ...state.theme,
        tokens: updatedAllTokens,
        updatedAt: new Date().toISOString(),
      };

      return {
        theme: updatedTheme,
        past: pushHistory(state.past, state.theme),
        future: [],
      };
    }),

  setVariant: (variant) =>
    set(() => ({
      activeVariant: variant,
    })),

  setDevice: (device) =>
    set(() => ({
      selectedDevice: device,
    })),

  setTargetUrl: (url) =>
    set(() => ({
      targetUrl: url,
    })),

  setConnectionState: (connectionState) =>
    set(() => ({
      connectionState,
    })),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        theme: previous,
        activeVariant: previous.activeVariant,
        past: newPast,
        future: [state.theme, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        theme: next,
        activeVariant: next.activeVariant,
        past: [...state.past, state.theme],
        future: newFuture,
      };
    }),

  resetToDefaults: () =>
    set((state) => {
      const defaultTheme = createDefaultTheme();
      return {
        theme: { ...defaultTheme, id: state.theme.id, name: state.theme.name },
        past: pushHistory(state.past, state.theme),
        future: [],
      };
    }),

  saveCurrentTheme: () => {
    // The actual localStorage save is triggered from the component layer
    // to keep the store pure. This is a no-op placeholder.
  },

  loadTheme: (theme) =>
    set(() => ({
      theme,
      activeVariant: theme.activeVariant,
      past: [],
      future: [],
    })),
}));

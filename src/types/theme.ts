export type ThemeVariant = 'light' | 'dark';

export type TokenCategory = 'colors' | 'typography' | 'shapes' | 'spacing';

export type TokenValues = Record<string, string>;

export type ThemeTokens = {
  light: Record<TokenCategory, TokenValues>;
  dark: Record<TokenCategory, TokenValues>;
};

export type Theme = {
  id: string;
  name: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  activeVariant: ThemeVariant;
  tokens: ThemeTokens;
};

export type DeviceId = 'iphone15pro' | 'pixel8' | 'ipadAir' | 'desktop';

export type Device = {
  id: DeviceId;
  name: string;
  width: number;
  height: number;
};

export type ConnectionState =
  | 'disconnected'
  | 'bridge'
  | 'same-origin'
  | 'failed';

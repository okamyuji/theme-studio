const THEME_UPDATE_TYPE = 'theme-studio:theme-update';
const PING_TYPE = 'theme-studio:ping';

export function sendThemeUpdate(
  iframe: HTMLIFrameElement,
  tokens: Record<string, string>,
): void {
  if (!iframe.contentWindow) return;
  iframe.contentWindow.postMessage({ type: THEME_UPDATE_TYPE, tokens }, '*');
}

export function sendPing(iframe: HTMLIFrameElement): void {
  if (!iframe.contentWindow) return;
  iframe.contentWindow.postMessage({ type: PING_TYPE }, '*');
}

export function createMessageHandler(
  onPong: () => void,
  onTokens: (tokens: Record<string, string>) => void,
): (event: MessageEvent) => void {
  return (event: MessageEvent) => {
    if (typeof event.data !== 'object' || event.data === null) return;

    const { type } = event.data as { type?: string };

    if (type === 'theme-studio:pong' || type === 'pong') {
      onPong();
      const tokens = (event.data as Record<string, unknown>).tokens;
      if (typeof tokens === 'object' && tokens !== null) {
        onTokens(tokens as Record<string, string>);
      }
    } else if (
      type === 'theme-studio:tokens' &&
      typeof (event.data as Record<string, unknown>).tokens === 'object'
    ) {
      onTokens((event.data as { tokens: Record<string, string> }).tokens);
    }
  };
}

export function validateOrigin(origin: string, allowed: string): boolean {
  if (!origin || !allowed) return false;
  return origin === allowed;
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSameOrigin(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

import { useRef, useEffect, useCallback } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { flattenTokens } from '../../lib/tokenUtils';
import {
  sendThemeUpdate,
  sendPing,
  createMessageHandler,
  validateUrl,
} from '../../lib/bridge';
import { ConnectionStatus } from './ConnectionStatus';
import styles from './IframePreview.module.css';

export function IframePreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    theme,
    activeVariant,
    targetUrl,
    connectionState,
    setTargetUrl,
    setConnectionState,
  } = useThemeStore();

  const tokens = flattenTokens(theme.tokens[activeVariant]);

  const handlePong = useCallback(() => {
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
    }
    setConnectionState('bridge');
  }, [setConnectionState]);

  const handleTokens = useCallback(() => {
    // Received tokens from iframe (acknowledgement)
  }, []);

  useEffect(() => {
    const handler = createMessageHandler(handlePong, handleTokens);
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handlePong, handleTokens]);

  useEffect(() => {
    if (!iframeRef.current || connectionState === 'disconnected') return;
    sendThemeUpdate(iframeRef.current, tokens);
  }, [tokens, connectionState]);

  function handleUrlSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;

    if (!validateUrl(url)) {
      setConnectionState('failed');
      return;
    }

    setTargetUrl(url);
    setConnectionState('disconnected');

    // Wait for iframe to load, then ping
    setTimeout(() => {
      if (!iframeRef.current) return;
      sendPing(iframeRef.current);

      pingTimeoutRef.current = setTimeout(() => {
        setConnectionState('failed');
      }, 3000);
    }, 1000);
  }

  // Theme Studio is a local development tool — the user intentionally loads trusted URLs.
  // allow-same-origin is required for the iframe app to load ES modules, access localStorage, etc.
  const sandboxValue = 'allow-scripts allow-same-origin allow-forms';

  return (
    <div className={styles.container}>
      <div className={styles.urlBar}>
        <form onSubmit={handleUrlSubmit} className={styles.urlForm}>
          <input
            type="text"
            name="url"
            className={styles.urlInput}
            placeholder="Enter app URL (http:// or https://)"
            defaultValue={targetUrl}
            aria-label="Preview URL"
            data-testid="url-input"
          />
          <button
            type="submit"
            className={styles.connectButton}
            data-testid="connect-button"
          >
            Connect
          </button>
        </form>
        <ConnectionStatus state={connectionState} />
      </div>

      {targetUrl ? (
        <iframe
          ref={iframeRef}
          src={targetUrl}
          sandbox={sandboxValue}
          className={styles.iframe}
          title="App preview"
          data-testid="preview-iframe"
        />
      ) : (
        <div className={styles.placeholder}>
          <p className={styles.placeholderText}>
            Enter a URL above to preview your app with theme changes
          </p>
        </div>
      )}
    </div>
  );
}

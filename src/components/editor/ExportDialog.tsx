import { useState, useRef, useMemo, useEffect } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { flattenTokens } from '../../lib/tokenUtils';
import type { TokenCategory } from '../../types/theme';
import styles from './ExportDialog.module.css';

type ExportFormat = 'css' | 'json' | 'tailwind';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

function generateCss(
  tokens: Record<TokenCategory, Record<string, string>>,
): string {
  const lines: string[] = [':root {'];
  const categories: TokenCategory[] = [
    'colors',
    'typography',
    'shapes',
    'spacing',
  ];

  for (const category of categories) {
    const values = tokens[category];
    if (!values || Object.keys(values).length === 0) continue;
    lines.push(`  /* ${category} */`);
    for (const [key, value] of Object.entries(values)) {
      lines.push(`  ${key}: ${value};`);
    }
    lines.push('');
  }

  lines.push('}');
  return lines.join('\n');
}

function generateJson(
  tokens: Record<TokenCategory, Record<string, string>>,
): string {
  return JSON.stringify(tokens, null, 2);
}

function generateTailwind(
  tokens: Record<TokenCategory, Record<string, string>>,
): string {
  const lines: string[] = [
    '// tailwind.config.js',
    'module.exports = {',
    '  theme: {',
    '    extend: {',
  ];

  // Colors
  const colors = tokens.colors;
  if (colors && Object.keys(colors).length > 0) {
    lines.push('      colors: {');
    for (const [key, value] of Object.entries(colors)) {
      const name = key.replace('--color-', '').replace(/-/g, '.');
      lines.push(`        '${name}': '${value}',`);
    }
    lines.push('      },');
  }

  // Font sizes
  const typography = tokens.typography;
  if (typography) {
    const fontSizes = Object.entries(typography).filter(([k]) =>
      k.startsWith('--font-size-'),
    );
    if (fontSizes.length > 0) {
      lines.push('      fontSize: {');
      for (const [key, value] of fontSizes) {
        const name = key.replace('--font-size-', '');
        lines.push(`        '${name}': '${value}',`);
      }
      lines.push('      },');
    }

    const fontFamilies = Object.entries(typography).filter(([k]) =>
      k.startsWith('--font-family-'),
    );
    if (fontFamilies.length > 0) {
      lines.push('      fontFamily: {');
      for (const [key, value] of fontFamilies) {
        const name = key.replace('--font-family-', '');
        lines.push(`        '${name}': '${value}',`);
      }
      lines.push('      },');
    }
  }

  // Border radius
  const shapes = tokens.shapes;
  if (shapes) {
    const radii = Object.entries(shapes).filter(([k]) =>
      k.startsWith('--radius-'),
    );
    if (radii.length > 0) {
      lines.push('      borderRadius: {');
      for (const [key, value] of radii) {
        const name = key.replace('--radius-', '');
        lines.push(`        '${name}': '${value}',`);
      }
      lines.push('      },');
    }

    const shadows = Object.entries(shapes).filter(([k]) =>
      k.startsWith('--shadow-'),
    );
    if (shadows.length > 0) {
      lines.push('      boxShadow: {');
      for (const [key, value] of shadows) {
        const name = key.replace('--shadow-', '');
        lines.push(`        '${name}': '${value}',`);
      }
      lines.push('      },');
    }
  }

  // Spacing
  const spacing = tokens.spacing;
  if (spacing && Object.keys(spacing).length > 0) {
    lines.push('      spacing: {');
    for (const [key, value] of Object.entries(spacing)) {
      const name = key.replace('--spacing-', '');
      lines.push(`        '${name}': '${value}',`);
    }
    lines.push('      },');
  }

  lines.push('    },');
  lines.push('  },');
  lines.push('};');

  return lines.join('\n');
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [format, setFormat] = useState<ExportFormat>('css');
  const [copied, setCopied] = useState(false);

  const { theme, activeVariant } = useThemeStore();
  const tokens = theme.tokens[activeVariant];

  const output = useMemo(() => {
    switch (format) {
      case 'css':
        return generateCss(tokens);
      case 'json':
        return generateJson(tokens);
      case 'tailwind':
        return generateTailwind(tokens);
    }
  }, [tokens, format]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available in all environments
    }
  }

  function handleDownloadJson() {
    const flat = flattenTokens(tokens);
    const blob = new Blob([JSON.stringify(flat, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name.replace(/\s+/g, '-').toLowerCase()}-tokens.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  const tabs: { id: ExportFormat; label: string }[] = [
    { id: 'css', label: 'CSS' },
    { id: 'json', label: 'JSON' },
    { id: 'tailwind', label: 'Tailwind' },
  ];

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleDialogClick}
      onClose={onClose}
      aria-label="Export theme"
      data-testid="export-dialog"
    >
      <div className={styles.dialogHeader}>
        <h2 className={styles.dialogTitle}>Export Theme</h2>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close dialog"
        >
          {'×'}
        </button>
      </div>

      <div className={styles.tabList} role="tablist" aria-label="Export format">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={format === tab.id ? styles.tabActive : styles.tab}
            onClick={() => setFormat(tab.id)}
            role="tab"
            aria-selected={format === tab.id}
            data-testid={`export-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.previewArea}>
        <textarea
          className={styles.codePreview}
          value={output}
          readOnly
          aria-label={`${format.toUpperCase()} export preview`}
          data-testid="export-preview"
        />
      </div>

      <div className={styles.dialogFooter}>
        {copied && (
          <span className={styles.copiedFeedback} data-testid="copied-feedback">
            Copied!
          </span>
        )}
        {format === 'json' && (
          <button
            className={styles.secondaryButton}
            onClick={handleDownloadJson}
            aria-label="Download JSON"
            data-testid="download-json-button"
          >
            Download
          </button>
        )}
        <button
          className={styles.actionButton}
          onClick={handleCopy}
          aria-label="Copy to clipboard"
          data-testid="copy-button"
        >
          Copy
        </button>
      </div>
    </dialog>
  );
}

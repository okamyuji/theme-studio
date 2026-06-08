import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useThemeStore } from '../../stores/themeStore';
import { getContrastRatio, getWcagLevel } from '../../lib/tokenUtils';
import { ContrastBadge } from '../ui/ContrastBadge';
import styles from './ColorTokenEditor.module.css';

const COLOR_GROUPS: {
  label: string;
  keys: string[];
}[] = [
  {
    label: 'Accent',
    keys: ['--color-primary', '--color-primary-light', '--color-secondary'],
  },
  {
    label: 'Background',
    keys: ['--color-background', '--color-surface'],
  },
  {
    label: 'Text',
    keys: [
      '--color-text-primary',
      '--color-text-secondary',
      '--color-text-accent',
    ],
  },
  {
    label: 'Semantic',
    keys: [
      '--color-border',
      '--color-error',
      '--color-success',
      '--color-warning',
    ],
  },
];

const TEXT_TOKEN_KEYS = new Set([
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-accent',
]);

function tokenLabel(key: string): string {
  return key
    .replace('--color-', '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function ColorTokenEditor() {
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const { theme, activeVariant, updateToken } = useThemeStore();
  const colors = theme.tokens[activeVariant].colors;
  const bgColor = colors['--color-background'] ?? '#FFFFFF';

  function handleSwatchClick(key: string) {
    setExpandedToken(expandedToken === key ? null : key);
  }

  function handleColorChange(key: string, value: string) {
    updateToken('colors', key, value);
  }

  function handleHexInput(key: string, value: string) {
    const cleaned = value.startsWith('#') ? value : `#${value}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
      updateToken('colors', key, cleaned);
    }
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Colors</h3>
      {COLOR_GROUPS.map((group) => (
        <div key={group.label} className={styles.group}>
          <h4 className={styles.groupLabel}>{group.label}</h4>
          {group.keys.map((key) => {
            const value = colors[key] ?? '#000000';
            const isText = TEXT_TOKEN_KEYS.has(key);
            const ratio = isText ? getContrastRatio(value, bgColor) : null;
            const level = ratio !== null ? getWcagLevel(ratio, false) : null;
            const isExpanded = expandedToken === key;

            return (
              <div key={key} className={styles.tokenRow}>
                <button
                  className={styles.swatch}
                  style={{ backgroundColor: value }}
                  onClick={() => handleSwatchClick(key)}
                  aria-label={`Edit ${tokenLabel(key)}`}
                  data-testid={`swatch-${key}`}
                />
                <div className={styles.tokenInfo}>
                  <span className={styles.tokenName}>{tokenLabel(key)}</span>
                  <span className={styles.tokenValue}>{value}</span>
                </div>
                {ratio !== null && level !== null && (
                  <ContrastBadge ratio={ratio} level={level} />
                )}
                {isExpanded && (
                  <div className={styles.pickerContainer}>
                    <HexColorPicker
                      color={value}
                      onChange={(c) => handleColorChange(key, c)}
                    />
                    <input
                      type="text"
                      className={styles.hexInput}
                      value={value}
                      onChange={(e) => handleHexInput(key, e.target.value)}
                      aria-label={`Hex value for ${tokenLabel(key)}`}
                      data-testid={`hex-input-${key}`}
                      maxLength={7}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

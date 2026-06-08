import { useThemeStore } from '../../stores/themeStore';
import styles from './TypographyEditor.module.css';

const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: 'Inter', value: '"Inter", sans-serif' },
  { label: 'Noto Sans JP', value: '"Noto Sans JP", sans-serif' },
  { label: 'Roboto', value: '"Roboto", sans-serif' },
  { label: 'System UI', value: 'system-ui, sans-serif' },
];

const FONT_SIZE_TOKENS: { key: string; label: string }[] = [
  { key: '--font-size-xs', label: 'XS' },
  { key: '--font-size-sm', label: 'SM' },
  { key: '--font-size-base', label: 'Base' },
  { key: '--font-size-lg', label: 'LG' },
  { key: '--font-size-xl', label: 'XL' },
  { key: '--font-size-2xl', label: '2XL' },
];

const FONT_WEIGHTS: { key: string; label: string; value: string }[] = [
  { key: '--font-weight-normal', label: 'Normal', value: '400' },
  { key: '--font-weight-medium', label: 'Medium', value: '500' },
  { key: '--font-weight-bold', label: 'Bold', value: '700' },
];

const LINE_HEIGHT_TOKENS: { key: string; label: string }[] = [
  { key: '--line-height-tight', label: 'Tight' },
  { key: '--line-height-normal', label: 'Normal' },
  { key: '--line-height-relaxed', label: 'Relaxed' },
];

function remToNumber(rem: string): number {
  const match = rem.match(/^([\d.]+)rem$/);
  return match ? parseFloat(match[1]) : 1;
}

export function TypographyEditor() {
  const { theme, activeVariant, updateToken } = useThemeStore();
  const typography = theme.tokens[activeVariant].typography;

  function handleFontFamilyChange(value: string) {
    updateToken('typography', '--font-family-base', value);
    updateToken('typography', '--font-family-heading', value);
  }

  function handleFontSizeChange(key: string, value: number) {
    updateToken('typography', key, `${value}rem`);
  }

  function handleWeightChange(key: string, value: string) {
    updateToken('typography', key, value);
  }

  function handleLineHeightChange(key: string, value: number) {
    updateToken('typography', key, String(value));
  }

  const currentFamily =
    typography['--font-family-base'] ?? FONT_FAMILIES[0].value;

  return (
    <div className={styles.container}>
      {/* Font Family */}
      <div className={styles.group}>
        <h4 className={styles.groupLabel}>Font Family</h4>
        <div className={styles.tokenRow}>
          <select
            className={styles.fontSelect}
            value={currentFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            aria-label="Font family"
            data-testid="font-family-select"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Font Sizes */}
      <div className={styles.group}>
        <h4 className={styles.groupLabel}>Font Size</h4>
        {FONT_SIZE_TOKENS.map(({ key, label }) => {
          const raw = typography[key] ?? '1rem';
          const num = remToNumber(raw);
          return (
            <div key={key} className={styles.tokenRow}>
              <div className={styles.tokenInfo}>
                <span className={styles.tokenName}>{label}</span>
                <span className={styles.tokenValue}>{raw}</span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={0.5}
                max={3}
                step={0.125}
                value={num}
                onChange={(e) =>
                  handleFontSizeChange(key, parseFloat(e.target.value))
                }
                aria-label={`Font size ${label}`}
                data-testid={`slider-${key}`}
              />
            </div>
          );
        })}
      </div>

      {/* Font Weights */}
      <div className={styles.group}>
        <h4 className={styles.groupLabel}>Font Weight</h4>
        {FONT_WEIGHTS.map(({ key, label, value }) => {
          const current = typography[key] ?? value;
          return (
            <div key={key} className={styles.tokenRow}>
              <div className={styles.tokenInfo}>
                <span className={styles.tokenName}>{label}</span>
                <span className={styles.tokenValue}>{current}</span>
              </div>
              <div className={styles.weightGroup}>
                {['400', '500', '600', '700'].map((w) => (
                  <button
                    key={w}
                    className={
                      current === w
                        ? styles.weightButtonActive
                        : styles.weightButton
                    }
                    onClick={() => handleWeightChange(key, w)}
                    aria-label={`Set ${label} weight to ${w}`}
                    aria-pressed={current === w}
                    data-testid={`weight-${key}-${w}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Line Heights */}
      <div className={styles.group}>
        <h4 className={styles.groupLabel}>Line Height</h4>
        {LINE_HEIGHT_TOKENS.map(({ key, label }) => {
          const raw = typography[key] ?? '1.5';
          const num = parseFloat(raw);
          return (
            <div key={key} className={styles.tokenRow}>
              <div className={styles.tokenInfo}>
                <span className={styles.tokenName}>{label}</span>
                <span className={styles.tokenValue}>{raw}</span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={1.0}
                max={2.0}
                step={0.05}
                value={num}
                onChange={(e) =>
                  handleLineHeightChange(key, parseFloat(e.target.value))
                }
                aria-label={`Line height ${label}`}
                data-testid={`slider-${key}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

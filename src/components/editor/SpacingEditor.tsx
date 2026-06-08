import { useThemeStore } from '../../stores/themeStore';
import styles from './SpacingEditor.module.css';

const SPACING_TOKENS: { key: string; label: string }[] = [
  { key: '--spacing-xs', label: 'XS' },
  { key: '--spacing-sm', label: 'SM' },
  { key: '--spacing-md', label: 'MD' },
  { key: '--spacing-lg', label: 'LG' },
  { key: '--spacing-xl', label: 'XL' },
  { key: '--spacing-2xl', label: '2XL' },
];

const MAX_SPACING = 64;

function pxToNumber(px: string): number {
  const match = px.match(/^([\d.]+)px$/);
  return match ? parseFloat(match[1]) : 0;
}

export function SpacingEditor() {
  const { theme, activeVariant, updateToken } = useThemeStore();
  const spacing = theme.tokens[activeVariant].spacing;

  function handleSpacingChange(key: string, value: number) {
    updateToken('spacing', key, `${value}px`);
  }

  return (
    <div className={styles.container}>
      {SPACING_TOKENS.map(({ key, label }) => {
        const raw = spacing[key] ?? '0px';
        const num = pxToNumber(raw);
        const barWidth = (num / MAX_SPACING) * 100;

        return (
          <div key={key} className={styles.tokenRow}>
            <div className={styles.tokenInfo}>
              <span className={styles.tokenName}>{label}</span>
              <span className={styles.tokenValue}>{raw}</span>
            </div>
            <div className={styles.sliderArea}>
              <input
                type="range"
                className={styles.slider}
                min={0}
                max={MAX_SPACING}
                step={1}
                value={num}
                onChange={(e) =>
                  handleSpacingChange(key, parseInt(e.target.value, 10))
                }
                aria-label={`Spacing ${label}`}
                data-testid={`slider-${key}`}
              />
              <div
                className={styles.spacingBar}
                style={{ width: `${barWidth}%` }}
                data-testid={`bar-${key}`}
                aria-hidden="true"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

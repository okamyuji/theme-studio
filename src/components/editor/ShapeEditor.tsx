import { useThemeStore } from '../../stores/themeStore';
import styles from './ShapeEditor.module.css';

const RADIUS_TOKENS: { key: string; label: string }[] = [
  { key: '--radius-sm', label: 'Small' },
  { key: '--radius-md', label: 'Medium' },
  { key: '--radius-lg', label: 'Large' },
];

type ShadowPreset = 'light' | 'medium' | 'heavy';

const SHADOW_PRESETS: Record<
  ShadowPreset,
  { sm: string; md: string; lg: string }
> = {
  light: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.07)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  },
  medium: {
    sm: '0 2px 4px rgba(0,0,0,0.1)',
    md: '0 6px 10px rgba(0,0,0,0.12)',
    lg: '0 15px 25px rgba(0,0,0,0.15)',
  },
  heavy: {
    sm: '0 4px 6px rgba(0,0,0,0.15)',
    md: '0 10px 15px rgba(0,0,0,0.2)',
    lg: '0 20px 40px rgba(0,0,0,0.25)',
  },
};

function pxToNumber(px: string): number {
  const match = px.match(/^([\d.]+)px$/);
  return match ? parseFloat(match[1]) : 0;
}

function detectShadowPreset(
  shapes: Record<string, string>,
): ShadowPreset | null {
  const sm = shapes['--shadow-sm'] ?? '';
  const md = shapes['--shadow-md'] ?? '';
  const lg = shapes['--shadow-lg'] ?? '';

  for (const [preset, values] of Object.entries(SHADOW_PRESETS)) {
    if (sm === values.sm && md === values.md && lg === values.lg) {
      return preset as ShadowPreset;
    }
  }
  return null;
}

export function ShapeEditor() {
  const { theme, activeVariant, updateToken } = useThemeStore();
  const shapes = theme.tokens[activeVariant].shapes;

  function handleRadiusChange(key: string, value: number) {
    updateToken('shapes', key, `${value}px`);
  }

  function handleShadowPreset(preset: ShadowPreset) {
    const values = SHADOW_PRESETS[preset];
    updateToken('shapes', '--shadow-sm', values.sm);
    updateToken('shapes', '--shadow-md', values.md);
    updateToken('shapes', '--shadow-lg', values.lg);
  }

  function handleOpacityChange(value: number) {
    updateToken('shapes', '--shape-opacity', String(value));
  }

  const activePreset = detectShadowPreset(shapes);
  const opacity = parseFloat(shapes['--shape-opacity'] ?? '1');

  return (
    <div className={styles.container}>
      {/* Border Radius */}
      <div className={styles.group}>
        <h4 className={styles.groupLabel}>Border Radius</h4>
        {RADIUS_TOKENS.map(({ key, label }) => {
          const raw = shapes[key] ?? '4px';
          const num = pxToNumber(raw);
          return (
            <div key={key} className={styles.tokenRow}>
              <div
                className={styles.radiusPreview}
                style={{ borderRadius: raw }}
                data-testid={`radius-preview-${key}`}
              />
              <div className={styles.tokenInfo}>
                <span className={styles.tokenName}>{label}</span>
                <span className={styles.tokenValue}>{raw}</span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={0}
                max={32}
                step={1}
                value={num}
                onChange={(e) =>
                  handleRadiusChange(key, parseInt(e.target.value, 10))
                }
                aria-label={`Border radius ${label}`}
                data-testid={`slider-${key}`}
              />
            </div>
          );
        })}
        {/* Full radius (read-only) */}
        <div className={styles.readonlyRow}>
          <div
            className={styles.radiusPreview}
            style={{ borderRadius: '9999px' }}
          />
          <div className={styles.tokenInfo}>
            <span className={styles.tokenName}>Full</span>
            <span className={styles.tokenValue}>9999px</span>
          </div>
        </div>
      </div>

      {/* Shadows */}
      <div className={styles.group}>
        <h4 className={styles.groupLabel}>Shadow Preset</h4>
        <div className={styles.tokenRow}>
          <div className={styles.presetGroup}>
            {(Object.keys(SHADOW_PRESETS) as ShadowPreset[]).map((preset) => (
              <button
                key={preset}
                className={
                  activePreset === preset
                    ? styles.presetButtonActive
                    : styles.presetButton
                }
                onClick={() => handleShadowPreset(preset)}
                aria-label={`Shadow preset ${preset}`}
                aria-pressed={activePreset === preset}
                data-testid={`shadow-preset-${preset}`}
              >
                {preset.charAt(0).toUpperCase() + preset.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Surface Opacity */}
      <div className={styles.group}>
        <h4 className={styles.groupLabel}>Surface Opacity</h4>
        <div className={styles.tokenRow}>
          <div className={styles.tokenInfo}>
            <span className={styles.tokenName}>Opacity</span>
            <span className={styles.tokenValue}>{opacity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
            aria-label="Surface opacity"
            data-testid="slider---shape-opacity"
          />
        </div>
      </div>
    </div>
  );
}

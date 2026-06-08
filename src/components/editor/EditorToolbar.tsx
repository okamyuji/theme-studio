import { useState } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { saveTheme } from '../../lib/storage';
import { DEVICES } from '../../lib/devices';
import type { DeviceId, ThemeVariant } from '../../types/theme';
import { ThemeListDialog } from './ThemeListDialog';
import { ExportDialog } from './ExportDialog';
import styles from './EditorToolbar.module.css';

export function EditorToolbar() {
  const {
    theme,
    activeVariant,
    selectedDevice,
    past,
    future,
    setVariant,
    setDevice,
    undo,
    redo,
  } = useThemeStore();

  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  function handleSave() {
    saveTheme(theme);
  }

  function handleVariantToggle() {
    const next: ThemeVariant = activeVariant === 'light' ? 'dark' : 'light';
    setVariant(next);
  }

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Editor toolbar">
      <select
        className={styles.deviceSelect}
        value={selectedDevice}
        onChange={(e) => setDevice(e.target.value as DeviceId)}
        aria-label="Device selector"
      >
        {Object.values(DEVICES).map((device) => (
          <option key={device.id} value={device.id}>
            {device.name}
          </option>
        ))}
      </select>

      <button
        className={styles.variantToggle}
        onClick={handleVariantToggle}
        aria-label={`Switch to ${activeVariant === 'light' ? 'dark' : 'light'} mode`}
        data-testid="variant-toggle"
      >
        <span className={styles.variantIcon}>
          {activeVariant === 'light' ? '☀' : '☾'}
        </span>
        <span className={styles.variantLabel}>
          {activeVariant === 'light' ? 'Light' : 'Dark'}
        </span>
      </button>

      <div className={styles.spacer} />

      <div className={styles.historyButtons}>
        <button
          className={styles.iconButton}
          onClick={undo}
          disabled={past.length === 0}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          className={styles.iconButton}
          onClick={redo}
          disabled={future.length === 0}
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
        >
          ↪
        </button>
      </div>

      <button
        className={styles.toolbarButton}
        onClick={() => setIsThemeDialogOpen(true)}
        aria-label="Manage themes"
        data-testid="themes-button"
      >
        Themes
      </button>

      <button
        className={styles.toolbarButton}
        onClick={() => setIsExportDialogOpen(true)}
        aria-label="Export theme"
        data-testid="export-button"
      >
        Export
      </button>

      <button
        className={styles.saveButton}
        onClick={handleSave}
        aria-label="Save theme"
      >
        Save
      </button>

      <ThemeListDialog
        open={isThemeDialogOpen}
        onClose={() => setIsThemeDialogOpen(false)}
      />
      <ExportDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  );
}

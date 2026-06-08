import { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { loadAllThemes, saveTheme, deleteTheme } from '../../lib/storage';
import type { Theme } from '../../types/theme';
import styles from './ThemeListDialog.module.css';

interface ThemeListDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeListDialog({ open, onClose }: ThemeListDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { theme: currentTheme, loadTheme } = useThemeStore();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (open) {
      refreshThemes();
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  function refreshThemes() {
    setThemes(loadAllThemes());
  }

  function handleCreate() {
    const newTheme: Theme = {
      ...structuredClone(currentTheme),
      id: crypto.randomUUID(),
      name: `${currentTheme.name} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveTheme(newTheme);
    refreshThemes();
  }

  function handleLoad(themeToLoad: Theme) {
    loadTheme(themeToLoad);
    onClose();
  }

  function handleDelete(id: string) {
    if (id === currentTheme.id) return;
    deleteTheme(id);
    refreshThemes();
  }

  function handleStartRename(themeItem: Theme) {
    setRenamingId(themeItem.id);
    setRenameValue(themeItem.name);
  }

  function handleFinishRename(id: string) {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingId(null);
      return;
    }

    const target = themes.find((t) => t.id === id);
    if (target) {
      const updated: Theme = {
        ...target,
        name: trimmed,
        updatedAt: new Date().toISOString(),
      };
      saveTheme(updated);
      if (id === currentTheme.id) {
        loadTheme(updated);
      }
    }
    setRenamingId(null);
    refreshThemes();
  }

  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return '';
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleDialogClick}
      onClose={onClose}
      aria-label="Theme management"
      data-testid="theme-list-dialog"
    >
      <div className={styles.dialogHeader}>
        <h2 className={styles.dialogTitle}>Themes</h2>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close dialog"
        >
          {'×'}
        </button>
      </div>

      <div className={styles.themeList}>
        {themes.length === 0 ? (
          <div className={styles.emptyState}>
            No saved themes yet. Save your current theme first.
          </div>
        ) : (
          themes.map((themeItem) => {
            const isActive = themeItem.id === currentTheme.id;
            const isRenaming = renamingId === themeItem.id;

            return (
              <div
                key={themeItem.id}
                className={isActive ? styles.themeItemActive : styles.themeItem}
                data-testid={`theme-item-${themeItem.id}`}
              >
                {isRenaming ? (
                  <input
                    className={styles.renameInput}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleFinishRename(themeItem.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(themeItem.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    aria-label="Rename theme"
                    data-testid="rename-input"
                    autoFocus
                  />
                ) : (
                  <button
                    className={styles.themeName}
                    onClick={() => handleLoad(themeItem)}
                    data-testid={`load-theme-${themeItem.id}`}
                  >
                    {themeItem.name}
                  </button>
                )}
                <span className={styles.themeDate}>
                  {formatDate(themeItem.updatedAt)}
                </span>
                <div className={styles.themeActions}>
                  <button
                    className={styles.smallButton}
                    onClick={() => handleStartRename(themeItem)}
                    aria-label={`Rename ${themeItem.name}`}
                    data-testid={`rename-theme-${themeItem.id}`}
                  >
                    {'✎'}
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(themeItem.id)}
                    disabled={isActive}
                    aria-label={`Delete ${themeItem.name}`}
                    data-testid={`delete-theme-${themeItem.id}`}
                  >
                    {'✕'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.dialogFooter}>
        <button
          className={styles.createButton}
          onClick={handleCreate}
          aria-label="Create new theme"
          data-testid="create-theme-button"
        >
          Create Copy
        </button>
      </div>
    </dialog>
  );
}

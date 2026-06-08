import { useEffect } from 'react';
import { EditorPanel } from './editor/EditorPanel';
import { PreviewPanel } from './preview/PreviewPanel';
import { useThemeStore } from '../stores/themeStore';
import styles from './App.module.css';

export function App() {
  const { undo, redo } = useThemeStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (isMod && e.key === 'Z') {
        e.preventDefault();
        redo();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className={styles.layout}>
      <EditorPanel />
      <PreviewPanel />
    </div>
  );
}

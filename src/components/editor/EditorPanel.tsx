import { EditorToolbar } from './EditorToolbar';
import { CollapsibleSection } from './CollapsibleSection';
import { ColorTokenEditor } from './ColorTokenEditor';
import { TypographyEditor } from './TypographyEditor';
import { ShapeEditor } from './ShapeEditor';
import { SpacingEditor } from './SpacingEditor';
import styles from './EditorPanel.module.css';

export function EditorPanel() {
  return (
    <aside className={styles.panel} aria-label="Theme editor">
      <EditorToolbar />
      <div className={styles.content}>
        <CollapsibleSection title="Colors" defaultOpen>
          <ColorTokenEditor />
        </CollapsibleSection>
        <CollapsibleSection title="Typography">
          <TypographyEditor />
        </CollapsibleSection>
        <CollapsibleSection title="Shapes">
          <ShapeEditor />
        </CollapsibleSection>
        <CollapsibleSection title="Spacing">
          <SpacingEditor />
        </CollapsibleSection>
      </div>
    </aside>
  );
}

import { useThemeStore } from '../../stores/themeStore';
import { DeviceFrame } from './DeviceFrame';
import { IframePreview } from './IframePreview';
import styles from './PreviewPanel.module.css';

export function PreviewPanel() {
  const { selectedDevice } = useThemeStore();

  return (
    <main className={styles.panel} aria-label="Device preview">
      <div className={styles.viewport}>
        <DeviceFrame deviceId={selectedDevice}>
          <IframePreview />
        </DeviceFrame>
      </div>
    </main>
  );
}

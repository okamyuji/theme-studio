import { useRef, useEffect, useState, type ReactNode } from 'react';
import { DEVICES } from '../../lib/devices';
import type { DeviceId } from '../../types/theme';
import styles from './DeviceFrame.module.css';

interface DeviceFrameProps {
  deviceId: DeviceId;
  children: ReactNode;
}

export function DeviceFrame({ deviceId, children }: DeviceFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const device = DEVICES[deviceId];

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const container = containerRef.current.parentElement;
      if (!container) return;

      const padding = 48;
      const bezelExtra = deviceId === 'desktop' ? 0 : 24;
      const labelHeight = 40;
      const availableWidth = container.clientWidth - padding * 2;
      const availableHeight = container.clientHeight - padding * 2;

      const frameWidth = device.width + bezelExtra;
      const frameHeight = device.height + bezelExtra + labelHeight;

      const scaleX = availableWidth / frameWidth;
      const scaleY = availableHeight / frameHeight;
      setScale(Math.min(scaleX, scaleY, 1));
    }

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current?.parentElement) {
      observer.observe(containerRef.current.parentElement);
    }
    return () => observer.disconnect();
  }, [device.width, device.height, deviceId]);

  const isIphone = deviceId === 'iphone15pro';
  const isAndroid = deviceId === 'pixel8';
  const isTablet = deviceId === 'ipadAir';
  const isDesktop = deviceId === 'desktop';

  function getBezelClass() {
    if (isIphone || isTablet) return styles.ios;
    if (isAndroid) return styles.android;
    return '';
  }

  function getScreenClass() {
    if (isIphone) return styles.ios;
    if (isTablet) return styles.tablet;
    if (isAndroid) return styles.android;
    return '';
  }

  if (isDesktop) {
    return (
      <div
        ref={containerRef}
        className={styles.frame}
        style={{ transform: `scale(${scale})` }}
        data-testid="device-frame"
        data-device={deviceId}
      >
        <div className={styles.desktopFrame}>
          <div className={styles.desktopTitlebar}>
            <div className={styles.desktopDots}>
              <span className={styles.dotRed} />
              <span className={styles.dotYellow} />
              <span className={styles.dotGreen} />
            </div>
            <div className={styles.desktopAddressBar}>{device.name}</div>
          </div>
          <div
            className={styles.desktopScreen}
            style={{ width: device.width, height: device.height - 36 }}
          >
            {children}
          </div>
        </div>
        <span className={styles.deviceLabel}>{device.name}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles.frame}
      style={{ transform: `scale(${scale})` }}
      data-testid="device-frame"
      data-device={deviceId}
    >
      <div
        className={`${styles.bezel} ${getBezelClass()}`}
        style={{
          width: device.width + 24,
          height: device.height + 24,
        }}
      >
        {isIphone && <div className={styles.dynamicIsland} />}
        {isAndroid && <div className={styles.punchHole} />}

        <div
          className={`${styles.screen} ${getScreenClass()}`}
          style={{
            width: device.width,
            height: device.height,
          }}
        >
          {children}
        </div>
      </div>
      <span className={styles.deviceLabel}>{device.name}</span>
    </div>
  );
}

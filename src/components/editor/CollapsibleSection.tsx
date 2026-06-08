import { useState, useRef, useEffect, type ReactNode } from 'react';
import styles from './CollapsibleSection.module.css';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>(
    defaultOpen ? 'none' : '0px',
  );

  useEffect(() => {
    if (!bodyRef.current) return;
    if (isOpen) {
      const scrollHeight = bodyRef.current.scrollHeight;
      setMaxHeight(`${scrollHeight}px`);
      const timer = setTimeout(() => setMaxHeight('none'), 200);
      return () => clearTimeout(timer);
    } else {
      // First set to current scroll height to animate from
      setMaxHeight(`${bodyRef.current.scrollHeight}px`);
      // Force reflow then set to 0
      requestAnimationFrame(() => {
        setMaxHeight('0px');
      });
    }
  }, [isOpen]);

  return (
    <div className={styles.section} data-testid={`section-${title}`}>
      <button
        className={styles.header}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={`section-body-${title}`}
      >
        <span className={isOpen ? styles.chevronOpen : styles.chevron}>
          {'▶'}
        </span>
        <span className={styles.title}>{title}</span>
      </button>
      <div
        ref={bodyRef}
        id={`section-body-${title}`}
        className={isOpen ? styles.bodyOpen : styles.body}
        style={{ maxHeight }}
        role="region"
        aria-labelledby={`section-header-${title}`}
      >
        <div className={styles.bodyContent}>{children}</div>
      </div>
    </div>
  );
}

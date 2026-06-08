import styles from './ContrastBadge.module.css';

interface ContrastBadgeProps {
  ratio: number;
  level: 'AAA' | 'AA' | 'fail';
}

export function ContrastBadge({ ratio, level }: ContrastBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[level]}`}
      title={`Contrast ratio: ${ratio.toFixed(1)}:1`}
      aria-label={`WCAG ${level === 'fail' ? 'Fail' : level} — ${ratio.toFixed(1)} to 1`}
    >
      {level === 'fail' ? 'Fail' : level} {ratio.toFixed(1)}
    </span>
  );
}

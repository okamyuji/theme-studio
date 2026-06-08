import type { ConnectionState } from '../../types/theme';
import styles from './ConnectionStatus.module.css';

interface ConnectionStatusProps {
  state: ConnectionState;
}

const LABELS: Record<ConnectionState, string> = {
  disconnected: 'Disconnected',
  bridge: 'Bridge Connected',
  'same-origin': 'Same-Origin',
  failed: 'Connection Failed',
};

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  return (
    <span
      className={`${styles.status} ${styles[state.replace('-', '') as keyof typeof styles] ?? styles.disconnected}`}
      data-testid="connection-status"
      aria-label={`Connection: ${LABELS[state]}`}
    >
      <span className={styles.dot} />
      {LABELS[state]}
    </span>
  );
}

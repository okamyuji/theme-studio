import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from './ConnectionStatus';

describe('ConnectionStatus', () => {
  it('renders disconnected state', () => {
    render(<ConnectionStatus state="disconnected" />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('renders bridge connected state', () => {
    render(<ConnectionStatus state="bridge" />);
    expect(screen.getByText('Bridge Connected')).toBeInTheDocument();
  });

  it('renders same-origin state', () => {
    render(<ConnectionStatus state="same-origin" />);
    expect(screen.getByText('Same-Origin')).toBeInTheDocument();
  });

  it('renders failed state', () => {
    render(<ConnectionStatus state="failed" />);
    expect(screen.getByText('Connection Failed')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<ConnectionStatus state="bridge" />);
    expect(
      screen.getByLabelText('Connection: Bridge Connected'),
    ).toBeInTheDocument();
  });
});

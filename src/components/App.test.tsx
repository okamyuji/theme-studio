import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the editor panel', () => {
    render(<App />);
    expect(screen.getByLabelText('Theme editor')).toBeInTheDocument();
  });

  it('renders the preview panel', () => {
    render(<App />);
    expect(screen.getByLabelText('Device preview')).toBeInTheDocument();
  });

  it('renders the editor toolbar', () => {
    render(<App />);
    expect(screen.getByLabelText('Editor toolbar')).toBeInTheDocument();
  });
});

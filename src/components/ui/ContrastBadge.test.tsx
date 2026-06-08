import { describe, it, expect } from 'vite-plus/test';
import { render, screen } from '@testing-library/react';
import { ContrastBadge } from './ContrastBadge';

describe('ContrastBadge', () => {
  it('renders AAA level', () => {
    render(<ContrastBadge ratio={8.5} level="AAA" />);
    expect(screen.getByText('AAA 8.5')).toBeInTheDocument();
  });

  it('renders AA level', () => {
    render(<ContrastBadge ratio={5.2} level="AA" />);
    expect(screen.getByText('AA 5.2')).toBeInTheDocument();
  });

  it('renders fail level', () => {
    render(<ContrastBadge ratio={2.1} level="fail" />);
    expect(screen.getByText('Fail 2.1')).toBeInTheDocument();
  });

  it('includes accessible label', () => {
    render(<ContrastBadge ratio={5.2} level="AA" />);
    expect(screen.getByLabelText('WCAG AA — 5.2 to 1')).toBeInTheDocument();
  });
});

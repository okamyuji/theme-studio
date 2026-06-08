import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorTokenEditor } from './ColorTokenEditor';
import { useThemeStore } from '../../stores/themeStore';

describe('ColorTokenEditor', () => {
  beforeEach(() => {
    useThemeStore.setState({
      ...useThemeStore.getInitialState(),
    });
  });

  it('renders color group headings', () => {
    render(<ColorTokenEditor />);
    expect(screen.getByText('Accent')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Background' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Text' })).toBeInTheDocument();
    expect(screen.getByText('Semantic')).toBeInTheDocument();
  });

  it('renders color swatches for all tokens', () => {
    render(<ColorTokenEditor />);
    const swatches = screen.getAllByTestId(/^swatch-/);
    expect(swatches.length).toBeGreaterThanOrEqual(12);
  });

  it('opens color picker when swatch is clicked', async () => {
    const user = userEvent.setup();
    render(<ColorTokenEditor />);

    const swatch = screen.getByTestId('swatch---color-primary');
    await user.click(swatch);

    expect(screen.getByTestId('hex-input---color-primary')).toBeInTheDocument();
  });

  it('shows contrast badge for text color tokens', () => {
    render(<ColorTokenEditor />);
    // Text tokens should have contrast badges
    const badges = screen.getAllByLabelText(/WCAG/);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('updates token via hex input', async () => {
    const user = userEvent.setup();
    render(<ColorTokenEditor />);

    const swatch = screen.getByTestId('swatch---color-primary');
    await user.click(swatch);

    const hexInput = screen.getByTestId(
      'hex-input---color-primary',
    ) as HTMLInputElement;
    // Simulate pasting a complete valid hex value
    await user.clear(hexInput);
    // Use paste to set complete value at once
    await user.click(hexInput);
    // fireEvent is more reliable for controlled inputs
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(hexInput, { target: { value: '#FF0000' } });

    const { theme } = useThemeStore.getState();
    expect(theme.tokens.light.colors['--color-primary']).toBe('#FF0000');
  });
});

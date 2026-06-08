import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TypographyEditor } from './TypographyEditor';
import { useThemeStore } from '../../stores/themeStore';

describe('TypographyEditor', () => {
  beforeEach(() => {
    useThemeStore.setState({
      ...useThemeStore.getInitialState(),
    });
  });

  it('renders font family selector', () => {
    render(<TypographyEditor />);
    expect(screen.getByLabelText('Font family')).toBeInTheDocument();
  });

  it('renders font size sliders for all tokens', () => {
    render(<TypographyEditor />);
    expect(screen.getByTestId('slider---font-size-xs')).toBeInTheDocument();
    expect(screen.getByTestId('slider---font-size-sm')).toBeInTheDocument();
    expect(screen.getByTestId('slider---font-size-base')).toBeInTheDocument();
    expect(screen.getByTestId('slider---font-size-lg')).toBeInTheDocument();
    expect(screen.getByTestId('slider---font-size-xl')).toBeInTheDocument();
    expect(screen.getByTestId('slider---font-size-2xl')).toBeInTheDocument();
  });

  it('renders font weight button groups', () => {
    render(<TypographyEditor />);
    expect(
      screen.getByTestId('weight---font-weight-normal-400'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('weight---font-weight-bold-700'),
    ).toBeInTheDocument();
  });

  it('renders line height sliders', () => {
    render(<TypographyEditor />);
    expect(
      screen.getByTestId('slider---line-height-tight'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('slider---line-height-normal'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('slider---line-height-relaxed'),
    ).toBeInTheDocument();
  });

  it('displays current font size values', () => {
    render(<TypographyEditor />);
    expect(screen.getByText('0.75rem')).toBeInTheDocument(); // xs default
    expect(screen.getByText('1rem')).toBeInTheDocument(); // base default
  });

  it('updates font size token on slider change', () => {
    render(<TypographyEditor />);
    const slider = screen.getByTestId(
      'slider---font-size-base',
    ) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '1.5' } });

    const { theme } = useThemeStore.getState();
    expect(theme.tokens.light.typography['--font-size-base']).toBe('1.5rem');
  });

  it('updates font family on select change', async () => {
    const user = userEvent.setup();
    render(<TypographyEditor />);
    const select = screen.getByTestId('font-family-select');
    await user.selectOptions(select, '"Roboto", sans-serif');

    const { theme } = useThemeStore.getState();
    expect(theme.tokens.light.typography['--font-family-base']).toBe(
      '"Roboto", sans-serif',
    );
    expect(theme.tokens.light.typography['--font-family-heading']).toBe(
      '"Roboto", sans-serif',
    );
  });

  it('updates font weight on button click', async () => {
    const user = userEvent.setup();
    render(<TypographyEditor />);
    const button = screen.getByTestId('weight---font-weight-normal-600');
    await user.click(button);

    const { theme } = useThemeStore.getState();
    expect(theme.tokens.light.typography['--font-weight-normal']).toBe('600');
  });

  it('updates line height on slider change', () => {
    render(<TypographyEditor />);
    const slider = screen.getByTestId(
      'slider---line-height-tight',
    ) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '1.35' } });

    const { theme } = useThemeStore.getState();
    expect(theme.tokens.light.typography['--line-height-tight']).toBe('1.35');
  });

  it('shows group labels', () => {
    render(<TypographyEditor />);
    expect(screen.getByText('Font Family')).toBeInTheDocument();
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('Font Weight')).toBeInTheDocument();
    expect(screen.getByText('Line Height')).toBeInTheDocument();
  });
});

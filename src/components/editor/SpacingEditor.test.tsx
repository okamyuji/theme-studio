import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpacingEditor } from './SpacingEditor';
import { useThemeStore } from '../../stores/themeStore';

describe('SpacingEditor', () => {
  beforeEach(() => {
    useThemeStore.setState({
      ...useThemeStore.getInitialState(),
    });
  });

  it('renders spacing sliders for all tokens', () => {
    render(<SpacingEditor />);
    expect(screen.getByTestId('slider---spacing-xs')).toBeInTheDocument();
    expect(screen.getByTestId('slider---spacing-sm')).toBeInTheDocument();
    expect(screen.getByTestId('slider---spacing-md')).toBeInTheDocument();
    expect(screen.getByTestId('slider---spacing-lg')).toBeInTheDocument();
    expect(screen.getByTestId('slider---spacing-xl')).toBeInTheDocument();
    expect(screen.getByTestId('slider---spacing-2xl')).toBeInTheDocument();
  });

  it('renders visual bars for spacing values', () => {
    render(<SpacingEditor />);
    expect(screen.getByTestId('bar---spacing-xs')).toBeInTheDocument();
    expect(screen.getByTestId('bar---spacing-md')).toBeInTheDocument();
  });

  it('displays current spacing values in px', () => {
    render(<SpacingEditor />);
    expect(screen.getByText('4px')).toBeInTheDocument(); // xs default
    expect(screen.getByText('16px')).toBeInTheDocument(); // md default
    expect(screen.getByText('32px')).toBeInTheDocument(); // xl default
  });

  it('updates spacing token on slider change', () => {
    render(<SpacingEditor />);
    const slider = screen.getByTestId(
      'slider---spacing-md',
    ) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '20' } });

    const { theme } = useThemeStore.getState();
    expect(theme.tokens.light.spacing['--spacing-md']).toBe('20px');
  });

  it('visual bar width reflects spacing value', () => {
    render(<SpacingEditor />);
    const bar = screen.getByTestId('bar---spacing-xl');
    // xl = 32px, max = 64, so width should be 50%
    expect(bar).toHaveStyle({ width: '50%' });
  });

  it('shows token labels', () => {
    render(<SpacingEditor />);
    expect(screen.getByText('XS')).toBeInTheDocument();
    expect(screen.getByText('SM')).toBeInTheDocument();
    expect(screen.getByText('MD')).toBeInTheDocument();
    expect(screen.getByText('LG')).toBeInTheDocument();
    expect(screen.getByText('XL')).toBeInTheDocument();
    expect(screen.getByText('2XL')).toBeInTheDocument();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShapeEditor } from './ShapeEditor';
import { useThemeStore } from '../../stores/themeStore';

describe('ShapeEditor', () => {
  beforeEach(() => {
    useThemeStore.setState({
      ...useThemeStore.getInitialState(),
    });
  });

  it('renders radius sliders for sm, md, lg', () => {
    render(<ShapeEditor />);
    expect(screen.getByTestId('slider---radius-sm')).toBeInTheDocument();
    expect(screen.getByTestId('slider---radius-md')).toBeInTheDocument();
    expect(screen.getByTestId('slider---radius-lg')).toBeInTheDocument();
  });

  it('renders radius preview squares', () => {
    render(<ShapeEditor />);
    expect(
      screen.getByTestId('radius-preview---radius-sm'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('radius-preview---radius-md'),
    ).toBeInTheDocument();
  });

  it('displays radius-full as read-only', () => {
    render(<ShapeEditor />);
    expect(screen.getByText('Full')).toBeInTheDocument();
    expect(screen.getByText('9999px')).toBeInTheDocument();
  });

  it('renders shadow preset buttons', () => {
    render(<ShapeEditor />);
    expect(screen.getByTestId('shadow-preset-light')).toBeInTheDocument();
    expect(screen.getByTestId('shadow-preset-medium')).toBeInTheDocument();
    expect(screen.getByTestId('shadow-preset-heavy')).toBeInTheDocument();
  });

  it('highlights current shadow preset', () => {
    render(<ShapeEditor />);
    const lightBtn = screen.getByTestId('shadow-preset-light');
    expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates radius token on slider change', () => {
    render(<ShapeEditor />);
    const slider = screen.getByTestId('slider---radius-md') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '12' } });

    const { theme } = useThemeStore.getState();
    expect(theme.tokens.light.shapes['--radius-md']).toBe('12px');
  });

  it('updates shadow tokens on preset selection', async () => {
    const user = userEvent.setup();
    render(<ShapeEditor />);
    const heavyBtn = screen.getByTestId('shadow-preset-heavy');
    await user.click(heavyBtn);

    const { theme } = useThemeStore.getState();
    expect(theme.tokens.light.shapes['--shadow-sm']).toBe(
      '0 4px 6px rgba(0,0,0,0.15)',
    );
    expect(theme.tokens.light.shapes['--shadow-md']).toBe(
      '0 10px 15px rgba(0,0,0,0.2)',
    );
    expect(theme.tokens.light.shapes['--shadow-lg']).toBe(
      '0 20px 40px rgba(0,0,0,0.25)',
    );
  });

  it('renders opacity slider', () => {
    render(<ShapeEditor />);
    expect(screen.getByTestId('slider---shape-opacity')).toBeInTheDocument();
  });

  it('updates opacity on slider change', () => {
    render(<ShapeEditor />);
    const slider = screen.getByTestId(
      'slider---shape-opacity',
    ) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '0.8' } });

    const { theme } = useThemeStore.getState();
    expect(theme.tokens.light.shapes['--shape-opacity']).toBe('0.8');
  });

  it('shows group labels', () => {
    render(<ShapeEditor />);
    expect(screen.getByText('Border Radius')).toBeInTheDocument();
    expect(screen.getByText('Shadow Preset')).toBeInTheDocument();
    expect(screen.getByText('Surface Opacity')).toBeInTheDocument();
  });
});

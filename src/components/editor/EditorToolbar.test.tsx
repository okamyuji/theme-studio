import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorToolbar } from './EditorToolbar';
import { useThemeStore } from '../../stores/themeStore';

// Mock storage module to avoid localStorage issues in tests
vi.mock('../../lib/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/storage')>();
  return {
    ...actual,
    saveTheme: vi.fn(),
  };
});

describe('EditorToolbar', () => {
  beforeEach(() => {
    useThemeStore.setState({
      ...useThemeStore.getInitialState(),
    });
  });

  it('renders device selector with default value', () => {
    render(<EditorToolbar />);
    const select = screen.getByLabelText(
      'Device selector',
    ) as HTMLSelectElement;
    expect(select.value).toBe('iphone15pro');
  });

  it('changes device when selector changes', async () => {
    const user = userEvent.setup();
    render(<EditorToolbar />);
    const select = screen.getByLabelText('Device selector');
    await user.selectOptions(select, 'pixel8');
    expect(useThemeStore.getState().selectedDevice).toBe('pixel8');
  });

  it('renders variant toggle showing current variant', () => {
    render(<EditorToolbar />);
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('toggles variant on click', async () => {
    const user = userEvent.setup();
    render(<EditorToolbar />);
    const toggle = screen.getByTestId('variant-toggle');
    await user.click(toggle);
    expect(useThemeStore.getState().activeVariant).toBe('dark');
  });

  it('disables undo button when no history', () => {
    render(<EditorToolbar />);
    const undoBtn = screen.getByLabelText('Undo');
    expect(undoBtn).toBeDisabled();
  });

  it('disables redo button when no future', () => {
    render(<EditorToolbar />);
    const redoBtn = screen.getByLabelText('Redo');
    expect(redoBtn).toBeDisabled();
  });

  it('enables undo after a token change', () => {
    useThemeStore
      .getState()
      .updateToken('colors', '--color-primary', '#FF0000');
    render(<EditorToolbar />);
    const undoBtn = screen.getByLabelText('Undo');
    expect(undoBtn).not.toBeDisabled();
  });

  it('calls saveTheme on save button click', async () => {
    const { saveTheme } = await import('../../lib/storage');
    const user = userEvent.setup();
    render(<EditorToolbar />);
    const saveBtn = screen.getByLabelText('Save theme');
    await user.click(saveBtn);
    expect(saveTheme).toHaveBeenCalled();
  });
});

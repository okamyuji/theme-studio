import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeListDialog } from './ThemeListDialog';
import { useThemeStore } from '../../stores/themeStore';

// Mock storage module
vi.mock('../../lib/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/storage')>();
  let storedThemes: ReturnType<typeof actual.createDefaultTheme>[] = [];

  return {
    ...actual,
    loadAllThemes: vi.fn(() => storedThemes),
    saveTheme: vi.fn((theme: ReturnType<typeof actual.createDefaultTheme>) => {
      const index = storedThemes.findIndex((t) => t.id === theme.id);
      if (index >= 0) {
        storedThemes = storedThemes.map((t, i) => (i === index ? theme : t));
      } else {
        storedThemes = [...storedThemes, theme];
      }
    }),
    deleteTheme: vi.fn((id: string) => {
      storedThemes = storedThemes.filter((t) => t.id !== id);
    }),
    _resetStore: () => {
      storedThemes = [];
    },
    _getStore: () => storedThemes,
    _setStore: (themes: ReturnType<typeof actual.createDefaultTheme>[]) => {
      storedThemes = themes;
    },
  };
});

// Mock HTMLDialogElement since jsdom doesn't support it
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe('ThemeListDialog', () => {
  const mockOnClose = vi.fn();

  beforeEach(async () => {
    useThemeStore.setState({
      ...useThemeStore.getInitialState(),
    });
    mockOnClose.mockClear();
    const storage = await import('../../lib/storage');
    (storage as unknown as { _resetStore: () => void })._resetStore();
  });

  it('renders dialog when open', () => {
    render(<ThemeListDialog open={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('theme-list-dialog')).toBeInTheDocument();
  });

  it('shows empty state when no themes saved', () => {
    render(<ThemeListDialog open={true} onClose={mockOnClose} />);
    expect(screen.getByText(/No saved themes yet/)).toBeInTheDocument();
  });

  it('creates a copy of current theme', async () => {
    const user = userEvent.setup();
    render(<ThemeListDialog open={true} onClose={mockOnClose} />);

    const createBtn = screen.getByTestId('create-theme-button');
    await user.click(createBtn);

    const { saveTheme } = await import('../../lib/storage');
    expect(saveTheme).toHaveBeenCalled();
  });

  it('shows themes after creation', async () => {
    const storage = await import('../../lib/storage');
    const { createDefaultTheme } = storage;
    const testTheme = {
      ...createDefaultTheme(),
      id: 'test-1',
      name: 'Test Theme',
    };
    (
      storage as unknown as {
        _setStore: (t: (typeof testTheme)[]) => void;
      }
    )._setStore([testTheme]);

    render(<ThemeListDialog open={true} onClose={mockOnClose} />);
    expect(screen.getByText('Test Theme')).toBeInTheDocument();
  });

  it('loads theme on click', async () => {
    const storage = await import('../../lib/storage');
    const { createDefaultTheme } = storage;
    const testTheme = {
      ...createDefaultTheme(),
      id: 'test-load',
      name: 'Load Me',
    };
    (
      storage as unknown as {
        _setStore: (t: (typeof testTheme)[]) => void;
      }
    )._setStore([testTheme]);

    const user = userEvent.setup();
    render(<ThemeListDialog open={true} onClose={mockOnClose} />);

    const loadBtn = screen.getByTestId('load-theme-test-load');
    await user.click(loadBtn);

    expect(useThemeStore.getState().theme.id).toBe('test-load');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('deletes non-active theme', async () => {
    const storage = await import('../../lib/storage');
    const { createDefaultTheme } = storage;
    const currentTheme = useThemeStore.getState().theme;
    const otherTheme = {
      ...createDefaultTheme(),
      id: 'other',
      name: 'Other Theme',
    };
    (
      storage as unknown as {
        _setStore: (t: (typeof currentTheme)[]) => void;
      }
    )._setStore([currentTheme, otherTheme]);

    const user = userEvent.setup();
    render(<ThemeListDialog open={true} onClose={mockOnClose} />);

    const deleteBtn = screen.getByTestId('delete-theme-other');
    await user.click(deleteBtn);

    expect(storage.deleteTheme).toHaveBeenCalledWith('other');
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeListDialog open={true} onClose={mockOnClose} />);

    const closeBtn = screen.getByLabelText('Close dialog');
    await user.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('starts rename on rename button click', async () => {
    const storage = await import('../../lib/storage');
    const { createDefaultTheme } = storage;
    const testTheme = {
      ...createDefaultTheme(),
      id: 'rename-test',
      name: 'Rename Me',
    };
    (
      storage as unknown as {
        _setStore: (t: (typeof testTheme)[]) => void;
      }
    )._setStore([testTheme]);

    const user = userEvent.setup();
    render(<ThemeListDialog open={true} onClose={mockOnClose} />);

    const renameBtn = screen.getByTestId('rename-theme-rename-test');
    await user.click(renameBtn);

    expect(screen.getByTestId('rename-input')).toBeInTheDocument();
  });
});

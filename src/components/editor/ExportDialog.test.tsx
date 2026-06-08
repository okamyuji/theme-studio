import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportDialog } from './ExportDialog';
import { useThemeStore } from '../../stores/themeStore';

// Mock HTMLDialogElement since jsdom doesn't support it
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe('ExportDialog', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    useThemeStore.setState({
      ...useThemeStore.getInitialState(),
    });
    mockOnClose.mockClear();
  });

  it('renders dialog when open', () => {
    render(<ExportDialog open={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
  });

  it('renders format tabs', () => {
    render(<ExportDialog open={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('export-tab-css')).toBeInTheDocument();
    expect(screen.getByTestId('export-tab-json')).toBeInTheDocument();
    expect(screen.getByTestId('export-tab-tailwind')).toBeInTheDocument();
  });

  it('shows CSS export by default', () => {
    render(<ExportDialog open={true} onClose={mockOnClose} />);
    const preview = screen.getByTestId('export-preview') as HTMLTextAreaElement;
    expect(preview.value).toContain(':root {');
    expect(preview.value).toContain('--color-primary');
  });

  it('switches to JSON export on tab click', async () => {
    const user = userEvent.setup();
    render(<ExportDialog open={true} onClose={mockOnClose} />);

    const jsonTab = screen.getByTestId('export-tab-json');
    await user.click(jsonTab);

    const preview = screen.getByTestId('export-preview') as HTMLTextAreaElement;
    expect(preview.value).toContain('"colors"');
    expect(preview.value).toContain('"--color-primary"');
  });

  it('switches to Tailwind export on tab click', async () => {
    const user = userEvent.setup();
    render(<ExportDialog open={true} onClose={mockOnClose} />);

    const tailwindTab = screen.getByTestId('export-tab-tailwind');
    await user.click(tailwindTab);

    const preview = screen.getByTestId('export-preview') as HTMLTextAreaElement;
    expect(preview.value).toContain('module.exports');
    expect(preview.value).toContain('theme:');
    expect(preview.value).toContain('extend:');
  });

  it('CSS export includes all token categories', () => {
    render(<ExportDialog open={true} onClose={mockOnClose} />);
    const preview = screen.getByTestId('export-preview') as HTMLTextAreaElement;
    expect(preview.value).toContain('/* colors */');
    expect(preview.value).toContain('/* typography */');
    expect(preview.value).toContain('/* shapes */');
    expect(preview.value).toContain('/* spacing */');
  });

  it('renders copy button', () => {
    render(<ExportDialog open={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('copy-button')).toBeInTheDocument();
  });

  it('copy button triggers clipboard write', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    render(<ExportDialog open={true} onClose={mockOnClose} />);

    const copyBtn = screen.getByTestId('copy-button');
    // Use fireEvent.click since dialog elements may block userEvent in jsdom
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.click(copyBtn);

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
    });
  });

  it('shows download button only for JSON tab', async () => {
    const user = userEvent.setup();
    render(<ExportDialog open={true} onClose={mockOnClose} />);

    // CSS tab - no download
    expect(
      screen.queryByTestId('download-json-button'),
    ).not.toBeInTheDocument();

    // Switch to JSON
    await user.click(screen.getByTestId('export-tab-json'));
    expect(screen.getByTestId('download-json-button')).toBeInTheDocument();

    // Switch to Tailwind - no download
    await user.click(screen.getByTestId('export-tab-tailwind'));
    expect(
      screen.queryByTestId('download-json-button'),
    ).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExportDialog open={true} onClose={mockOnClose} />);

    const closeBtn = screen.getByLabelText('Close dialog');
    await user.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('highlights active tab', () => {
    render(<ExportDialog open={true} onClose={mockOnClose} />);
    const cssTab = screen.getByTestId('export-tab-css');
    expect(cssTab).toHaveAttribute('aria-selected', 'true');
  });
});

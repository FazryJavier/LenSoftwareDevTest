import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Field, TextInput } from './Field';
import { Toast } from './Toast';

describe('Button', () => {
  it('does not submit a form unless asked to', () => {
    render(<Button>Batal</Button>);

    expect(screen.getByRole('button', { name: 'Batal' })).toHaveAttribute('type', 'button');
  });

  it('can be disabled', () => {
    render(<Button disabled>Simpan</Button>);

    expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled();
  });
});

describe('Field', () => {
  it('connects the label to its control', () => {
    render(
      <Field id="name" label="Nama" required>
        <TextInput id="name" />
      </Field>,
    );

    expect(screen.getByLabelText(/Nama/)).toHaveAttribute('aria-invalid', 'false');
  });

  it('connects the error message to its control', () => {
    render(
      <Field id="name" label="Nama" error="Nama wajib diisi.">
        <TextInput id="name" error="Nama wajib diisi." />
      </Field>,
    );

    const input = screen.getByLabelText('Nama');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Nama wajib diisi.');
  });
});

describe('Dialog', () => {
  it('opens as a labelled modal', () => {
    render(
      <Dialog title="Batalkan?" onDismiss={vi.fn()} actions={<Button>Ya</Button>}>
        Perubahan akan hilang.
      </Dialog>,
    );

    expect(screen.getByRole('dialog', { name: 'Batalkan?' })).toHaveTextContent(
      'Perubahan akan hilang.',
    );
  });

  it('reports the Escape key without closing itself', () => {
    const onDismiss = vi.fn();
    render(
      <Dialog title="Batalkan?" onDismiss={onDismiss} actions={null}>
        Isi
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');

    const event = new Event('cancel', { cancelable: true });
    act(() => {
      dialog.dispatchEvent(event);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(dialog).toHaveAttribute('open');
  });
});

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces the message, then dismisses itself', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast message="Tersimpan." onDismiss={onDismiss} />);

    expect(screen.getByRole('status')).toHaveTextContent('Tersimpan.');
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

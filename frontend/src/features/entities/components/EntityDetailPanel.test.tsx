import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Entity } from '../schema';
import { EntityDetailPanel } from './EntityDetailPanel';

const ID = '0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e11';

const ENTITY: Entity = {
  id: ID,
  name: 'Truk Logistik',
  type: 'vehicle',
  status: 'maintenance',
  description: 'Armada area Bandung',
  attributes: { plate_number: 'D 1234 ABC' },
  latitude: -6.9175,
  longitude: 107.6191,
  created_at: '2026-11-05T10:00:00Z',
  updated_at: '2026-11-06T10:00:00Z',
};

function success(data: unknown) {
  return new Response(
    JSON.stringify({ code: 200, success: true, message: 'OK.', data, errors: null, meta: null }),
  );
}

function failure(status: number, code: string) {
  return new Response(
    JSON.stringify({
      code: status,
      success: false,
      message: 'Failed.',
      data: null,
      errors: [{ field: null, code, message: 'Failed.' }],
      meta: null,
    }),
    { status },
  );
}

const fetchStub = vi.fn<() => Promise<Response>>();
const onClose = vi.fn();
const onEdit = vi.fn();
const onDeleted = vi.fn();

function renderPanel() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <EntityDetailPanel entityId={ID} onClose={onClose} onEdit={onEdit} onDeleted={onDeleted} />
    </QueryClientProvider>,
  );
}

describe('EntityDetailPanel', () => {
  beforeEach(() => {
    fetchStub.mockReset();
    onClose.mockReset();
    onEdit.mockReset();
    onDeleted.mockReset();
    vi.stubGlobal('fetch', fetchStub);
  });

  it('shows a loading message and moves focus to the close button', () => {
    fetchStub.mockReturnValue(new Promise(() => undefined));

    renderPanel();

    expect(screen.getByRole('status')).toHaveTextContent('Memuat detail');
    expect(screen.getByRole('button', { name: 'Tutup detail' })).toHaveFocus();
  });

  it('shows every field of the entity', async () => {
    fetchStub.mockResolvedValue(success(ENTITY));

    renderPanel();

    expect(await screen.findByRole('heading', { name: 'Truk Logistik' })).toBeInTheDocument();
    expect(screen.getByText('Pemeliharaan')).toBeInTheDocument();
    expect(screen.getByText('Kendaraan')).toBeInTheDocument();
    expect(screen.getByText('Armada area Bandung')).toBeInTheDocument();
    expect(screen.getByText('plate_number')).toBeInTheDocument();
    expect(screen.getByText('D 1234 ABC')).toBeInTheDocument();
    expect(screen.getByText('-6.91750, 107.61910')).toBeInTheDocument();
    expect(screen.getByText(/5 Nov 2026/)).toBeInTheDocument();
    expect(screen.getByText(/6 Nov 2026/)).toBeInTheDocument();
  });

  it('says when the optional fields are empty', async () => {
    fetchStub.mockResolvedValue(success({ ...ENTITY, description: null, attributes: {} }));

    renderPanel();

    expect(await screen.findByText('Tidak ada deskripsi.')).toBeInTheDocument();
    expect(screen.getByText('Tidak ada atribut.')).toBeInTheDocument();
  });

  it('shows values containing HTML as plain text', async () => {
    const html = '<img src=x onerror=alert(1)>';
    fetchStub.mockResolvedValue(
      success({ ...ENTITY, name: html, description: html, attributes: { note: html } }),
    );

    renderPanel();

    expect(await screen.findByRole('heading', { name: html })).toBeInTheDocument();
    expect(screen.getAllByText(html)).toHaveLength(3);
    expect(document.querySelector('img')).toBeNull();
  });

  it('says the entity was not found on a 404, without offering a retry or requesting again', async () => {
    fetchStub.mockResolvedValue(failure(404, 'not_found'));

    renderPanel();

    expect(await screen.findByRole('alert')).toHaveTextContent('tidak ditemukan');
    expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument();
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it('recovers from another failure through the retry button', async () => {
    fetchStub.mockResolvedValueOnce(failure(500, 'internal_error'));
    fetchStub.mockResolvedValueOnce(success(ENTITY));

    renderPanel();
    expect(await screen.findByRole('alert')).toHaveTextContent('gagal dimuat');

    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByRole('heading', { name: 'Truk Logistik' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('treats a response that breaks the contract as a failure', async () => {
    fetchStub.mockResolvedValue(success({ ...ENTITY, status: 'lost' }));

    renderPanel();

    expect(await screen.findByRole('alert')).toHaveTextContent('gagal dimuat');
  });

  it('offers to edit once the entity has loaded', async () => {
    fetchStub.mockResolvedValue(success(ENTITY));
    renderPanel();
    expect(screen.queryByRole('button', { name: 'Ubah' })).not.toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: 'Ubah' }));

    expect(onEdit).toHaveBeenCalledWith(ENTITY);
  });

  describe('deleting', () => {
    const deletes = () => fetchStub.mock.calls.length - 1;

    async function openDialog() {
      fetchStub.mockResolvedValueOnce(success(ENTITY));
      renderPanel();
      await userEvent.click(await screen.findByRole('button', { name: 'Hapus' }));
      return screen.getByRole('dialog', { name: 'Hapus entitas?' });
    }

    it('names the entity and sends nothing until confirmed', async () => {
      const dialog = await openDialog();

      expect(dialog).toHaveTextContent('Truk Logistik');
      expect(deletes()).toBe(0);
    });

    it('sends nothing when cancelled', async () => {
      const dialog = await openDialog();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Batal' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(deletes()).toBe(0);
      expect(onDeleted).not.toHaveBeenCalled();
    });

    it('reports success after confirming', async () => {
      const dialog = await openDialog();
      fetchStub.mockResolvedValueOnce(success(null));

      await userEvent.click(within(dialog).getByRole('button', { name: 'Hapus' }));

      await waitFor(() => {
        expect(onDeleted).toHaveBeenCalledWith('Entitas berhasil dihapus.');
      });
    });

    it('treats a 404 as already gone', async () => {
      const dialog = await openDialog();
      fetchStub.mockResolvedValueOnce(failure(404, 'not_found'));

      await userEvent.click(within(dialog).getByRole('button', { name: 'Hapus' }));

      await waitFor(() => {
        expect(onDeleted).toHaveBeenCalledWith('Entitas ini sudah tidak ada.');
      });
    });

    it('keeps the dialog open with a message on failure, and can try again', async () => {
      const dialog = await openDialog();
      fetchStub.mockResolvedValueOnce(failure(500, 'internal_error'));

      await userEvent.click(within(dialog).getByRole('button', { name: 'Hapus' }));

      expect(await within(dialog).findByRole('alert')).toHaveTextContent('gagal dihapus');
      expect(onDeleted).not.toHaveBeenCalled();

      fetchStub.mockResolvedValueOnce(success(null));
      await userEvent.click(within(dialog).getByRole('button', { name: 'Hapus' }));

      await waitFor(() => {
        expect(onDeleted).toHaveBeenCalledWith('Entitas berhasil dihapus.');
      });
    });

    it('shows the name as plain text', async () => {
      const html = '<img src=x onerror=alert(1)>';
      fetchStub.mockResolvedValueOnce(success({ ...ENTITY, name: html }));
      renderPanel();

      await userEvent.click(await screen.findByRole('button', { name: 'Hapus' }));

      expect(screen.getByRole('dialog')).toHaveTextContent(html);
      expect(document.querySelector('img')).toBeNull();
    });
  });

  it('calls onClose from the close button', async () => {
    fetchStub.mockResolvedValue(success(ENTITY));
    renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Tutup detail' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

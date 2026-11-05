import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapPoint } from '../formSchema';
import type { Entity } from '../schema';
import { EntityForm } from './EntityForm';

const CREATED: Entity = {
  id: '0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e11',
  name: 'Truk',
  type: 'vehicle',
  status: 'active',
  description: null,
  attributes: {},
  latitude: -6.9,
  longitude: 107.6,
  created_at: '2026-11-05T10:00:00Z',
  updated_at: '2026-11-05T10:00:00Z',
};

function created() {
  return new Response(
    JSON.stringify({
      code: 201,
      success: true,
      message: 'Entity created.',
      data: CREATED,
      errors: null,
      meta: null,
    }),
    { status: 201 },
  );
}

function failure(status: number, errors: unknown[]) {
  return new Response(
    JSON.stringify({
      code: status,
      success: false,
      message: 'Failed.',
      data: null,
      errors,
      meta: null,
    }),
    { status },
  );
}

const fetchStub = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();
const onCreated = vi.fn();
const onCancel = vi.fn();
const onDraftLocationChange = vi.fn();
const queryClient = () => new QueryClient();

function formWith(client: QueryClient, pickedPoint: MapPoint | null) {
  return (
    <QueryClientProvider client={client}>
      <EntityForm
        pickedPoint={pickedPoint}
        onDraftLocationChange={onDraftLocationChange}
        onCreated={onCreated}
        onCancel={onCancel}
      />
    </QueryClientProvider>
  );
}

function renderForm() {
  const client = queryClient();
  const { rerender } = render(formWith(client, null));
  return {
    pickPoint: (point: MapPoint) => {
      rerender(formWith(client, point));
    },
  };
}

function sentBody(init: RequestInit | undefined): unknown {
  if (typeof init?.body !== 'string') {
    throw new Error('The request has no JSON body.');
  }
  return JSON.parse(init.body);
}

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText(/Nama/), 'Truk');
  await userEvent.selectOptions(screen.getByLabelText(/Jenis/), 'vehicle');
  await userEvent.selectOptions(screen.getByLabelText(/Status/), 'active');
  await userEvent.type(screen.getByLabelText(/Latitude/), '-6.9');
  await userEvent.type(screen.getByLabelText(/Longitude/), '107.6');
}

const save = () => userEvent.click(screen.getByRole('button', { name: 'Simpan' }));

describe('EntityForm', () => {
  beforeEach(() => {
    fetchStub.mockReset();
    onCreated.mockReset();
    onCancel.mockReset();
    onDraftLocationChange.mockReset();
    vi.stubGlobal('fetch', fetchStub);
  });

  it('moves focus to the name field', async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText(/Nama/)).toHaveFocus();
    });
  });

  it('shows messages on the fields without sending a request when the data is invalid', async () => {
    renderForm();

    await save();

    expect(await screen.findByText('Nama wajib diisi.')).toBeInTheDocument();
    expect(screen.getByText('Pilih jenis entitas.')).toBeInTheDocument();
    expect(screen.getByText('Pilih status entitas.')).toBeInTheDocument();
    expect(screen.getByText('Latitude wajib diisi.')).toBeInTheDocument();
    expect(screen.getByText('Longitude wajib diisi.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama/)).toHaveAccessibleDescription('Nama wajib diisi.');
    expect(fetchStub).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('sends the payload and reports the created entity', async () => {
    fetchStub.mockResolvedValue(created());
    renderForm();
    await fillRequiredFields();
    await userEvent.type(screen.getByLabelText('Deskripsi'), 'Armada');
    await userEvent.click(screen.getByRole('button', { name: 'Tambah atribut' }));
    await userEvent.type(screen.getByLabelText('Key'), 'plate_number');
    await userEvent.type(screen.getByLabelText('Nilai'), 'D 1234');

    await save();

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1);
    });
    expect(onCreated.mock.calls[0]?.[0]).toEqual(CREATED);
    const [url, init] = fetchStub.mock.calls[0] ?? [];
    expect(url).toBe('/api/v1/entities');
    expect(init?.method).toBe('POST');
    expect(sentBody(init)).toEqual({
      name: 'Truk',
      type: 'vehicle',
      status: 'active',
      description: 'Armada',
      attributes: { plate_number: 'D 1234' },
      latitude: -6.9,
      longitude: 107.6,
    });
  });

  it('accepts zero coordinates', async () => {
    fetchStub.mockResolvedValue(created());
    renderForm();
    await userEvent.type(screen.getByLabelText(/Nama/), 'Nol');
    await userEvent.selectOptions(screen.getByLabelText(/Jenis/), 'other');
    await userEvent.selectOptions(screen.getByLabelText(/Status/), 'active');
    await userEvent.type(screen.getByLabelText(/Latitude/), '0');
    await userEvent.type(screen.getByLabelText(/Longitude/), '0');

    await save();

    await waitFor(() => {
      expect(fetchStub).toHaveBeenCalledTimes(1);
    });
    expect(sentBody(fetchStub.mock.calls[0]?.[1])).toMatchObject({
      latitude: 0,
      longitude: 0,
      description: null,
      attributes: {},
    });
  });

  it('does not send a second request while one is running', async () => {
    let finish: (response: Response) => void = () => undefined;
    fetchStub.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderForm();
    await fillRequiredFields();

    await save();

    const button = await screen.findByRole('button', { name: 'Menyimpan…' });
    expect(button).toBeDisabled();
    const form = button.closest('form');
    if (form === null) {
      throw new Error('The button is outside the form.');
    }
    fireEvent.submit(form);
    await waitFor(() => {
      expect(fetchStub).toHaveBeenCalledTimes(1);
    });

    act(() => {
      finish(created());
    });
    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1);
    });
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it('shows server validation errors on the fields and keeps what was typed', async () => {
    fetchStub.mockResolvedValue(
      failure(422, [
        { field: 'latitude', code: 'out_of_range', message: 'Out of range.' },
        { field: 'attributes.a', code: 'too_long', message: 'Too long.' },
      ]),
    );
    renderForm();
    await fillRequiredFields();

    await save();

    expect(await screen.findByText('Nilainya di luar rentang yang diizinkan.')).toBeInTheDocument();
    expect(screen.getByText('Isinya terlalu panjang.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama/)).toHaveValue('Truk');
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('shows a general message on other failures and can try again', async () => {
    fetchStub.mockResolvedValueOnce(
      failure(500, [{ field: null, code: 'internal_error', message: 'Internal.' }]),
    );
    fetchStub.mockResolvedValueOnce(created());
    renderForm();
    await fillRequiredFields();

    await save();
    expect(await screen.findByRole('alert')).toHaveTextContent('gagal disimpan');
    expect(screen.getByLabelText(/Nama/)).toHaveValue('Truk');

    await save();

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1);
    });
  });

  it('adds and removes attributes, and rejects a repeated key', async () => {
    renderForm();
    await fillRequiredFields();
    const add = screen.getByRole('button', { name: 'Tambah atribut' });
    await userEvent.click(add);
    await userEvent.click(add);
    for (const keyInput of screen.getAllByLabelText('Key')) {
      await userEvent.type(keyInput, 'sama');
    }

    await save();

    expect(await screen.findByText('Key atribut sudah dipakai.')).toBeInTheDocument();
    expect(fetchStub).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Hapus atribut 2' }));

    expect(screen.getAllByLabelText('Key')).toHaveLength(1);
  });

  it('fills the coordinates from a point picked on the map', async () => {
    const { pickPoint } = renderForm();

    pickPoint({ latitude: -6.123456789, longitude: 107.5 });

    await waitFor(() => {
      expect(screen.getByLabelText(/Latitude/)).toHaveValue('-6.123457');
    });
    expect(screen.getByLabelText(/Longitude/)).toHaveValue('107.500000');
    await waitFor(() => {
      expect(onDraftLocationChange).toHaveBeenLastCalledWith({
        latitude: -6.123457,
        longitude: 107.5,
      });
    });
  });

  it('reports typed coordinates only while they are valid', async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/Latitude/), '-6.9');
    await userEvent.type(screen.getByLabelText(/Longitude/), '107.6');

    await waitFor(() => {
      expect(onDraftLocationChange).toHaveBeenLastCalledWith({ latitude: -6.9, longitude: 107.6 });
    });

    await userEvent.type(screen.getByLabelText(/Latitude/), 'x');

    await waitFor(() => {
      expect(onDraftLocationChange).toHaveBeenLastCalledWith(null);
    });
  });

  describe('cancelling', () => {
    it('closes immediately when nothing changed', async () => {
      renderForm();

      await userEvent.click(screen.getByRole('button', { name: 'Batal' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('asks first when something changed, and closes after confirming', async () => {
      renderForm();
      await userEvent.type(screen.getByLabelText(/Nama/), 'Truk');

      await userEvent.click(screen.getByRole('button', { name: 'Batal' }));

      expect(onCancel).not.toHaveBeenCalled();
      await userEvent.click(screen.getByRole('button', { name: 'Buang' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('keeps the form when the confirmation is declined', async () => {
      renderForm();
      await userEvent.type(screen.getByLabelText(/Nama/), 'Truk');
      await userEvent.click(screen.getByRole('button', { name: 'Tutup form' }));

      await userEvent.click(screen.getByRole('button', { name: 'Lanjut mengisi' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Nama/)).toHaveValue('Truk');
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('treats the Escape key like the cancel button', async () => {
      renderForm();

      await userEvent.keyboard('{Escape}');

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BackendStatus } from './BackendStatus';

const HEALTHY = JSON.stringify({
  code: 200,
  success: true,
  message: 'Service is healthy.',
  data: null,
  errors: null,
  meta: null,
});

const UNAVAILABLE = JSON.stringify({
  code: 503,
  success: false,
  message: 'Service unavailable.',
  data: null,
  errors: [{ field: null, code: 'unavailable', message: 'Unavailable.' }],
  meta: null,
});

function renderStatus() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BackendStatus />
    </QueryClientProvider>,
  );
}

describe('BackendStatus', () => {
  it('shows a checking message while the request is pending', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );

    renderStatus();

    expect(screen.getByRole('status')).toHaveTextContent('Memeriksa koneksi');
  });

  it('shows connected when the backend is healthy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(HEALTHY))),
    );

    renderStatus();

    expect(await screen.findByText('Backend terhubung')).toBeInTheDocument();
  });

  it('shows an error with a retry button when the backend is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(UNAVAILABLE, { status: 503 }))),
    );

    renderStatus();

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend tidak terhubung');
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeEnabled();
  });

  it('recovers when retrying succeeds', async () => {
    const fetchStub = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(new Response(UNAVAILABLE, { status: 503 }))
      .mockResolvedValueOnce(new Response(HEALTHY));
    vi.stubGlobal('fetch', fetchStub);

    renderStatus();
    await userEvent.click(await screen.findByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByText('Backend terhubung')).toBeInTheDocument();
    expect(fetchStub).toHaveBeenCalledTimes(2);
  });
});

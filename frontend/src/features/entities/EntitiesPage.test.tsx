import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EntitiesPage } from './EntitiesPage';
import type { Entity } from './schema';

interface FakeEvent {
  target: { getBounds: () => FakeBounds };
}

interface FakeBounds {
  getWest: () => number;
  getSouth: () => number;
  getEast: () => number;
  getNorth: () => number;
}

interface FakeMapProps {
  children: ReactNode;
  onLoad: (event: FakeEvent) => void;
  onError: (event: FakeEvent) => void;
  onMoveEnd: (event: FakeEvent) => void;
  mapStyle: string;
}

const fakeMap = vi.hoisted((): { props?: FakeMapProps } => ({}));

// jsdom has no WebGL, so the map itself is exercised by the Playwright tests.
vi.mock('@vis.gl/react-maplibre', () => ({
  Map: (props: FakeMapProps) => {
    fakeMap.props = props;
    return <div data-testid="map">{props.children}</div>;
  },
  Marker: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  NavigationControl: () => null,
}));

vi.mock('maplibre-gl', () => ({ setWorkerUrl: vi.fn() }));

function mapProps(): FakeMapProps {
  if (fakeMap.props === undefined) {
    throw new Error('The map has not been rendered yet.');
  }
  return fakeMap.props;
}

function view(west: number, south: number, east: number, north: number): FakeEvent {
  return {
    target: {
      getBounds: () => ({
        getWest: () => west,
        getSouth: () => south,
        getEast: () => east,
        getNorth: () => north,
      }),
    },
  };
}

function entity(overrides: Partial<Entity>): Entity {
  return {
    id: '0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e11',
    name: 'Truk Logistik',
    type: 'vehicle',
    status: 'active',
    description: null,
    attributes: {},
    latitude: -6.9,
    longitude: 107.6,
    created_at: '2026-11-05T10:00:00Z',
    updated_at: '2026-11-05T10:00:00Z',
    ...overrides,
  };
}

function listResponse(entities: Entity[], total = entities.length) {
  return new Response(
    JSON.stringify({
      code: 200,
      success: true,
      message: 'Entities retrieved.',
      data: entities,
      errors: null,
      meta: { page: 1, per_page: 500, total, total_pages: 1 },
    }),
  );
}

function failureResponse() {
  return new Response(
    JSON.stringify({
      code: 500,
      success: false,
      message: 'Internal server error.',
      data: null,
      errors: [{ field: null, code: 'internal_error', message: 'Internal server error.' }],
      meta: null,
    }),
    { status: 500 },
  );
}

const fetchStub = vi.fn<(url: string) => Promise<Response>>();

function requestedBbox(call: number): string | null {
  const url = fetchStub.mock.calls[call]?.[0];
  return url === undefined ? null : new URL(url, 'http://localhost').searchParams.get('bbox');
}

function renderLoadedPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <EntitiesPage mapStyleUrl="https://tiles.example.com/style" />
    </QueryClientProvider>,
  );
  act(() => {
    mapProps().onLoad(view(106, -7, 108, -6));
  });
}

describe('EntitiesPage', () => {
  beforeEach(() => {
    fetchStub.mockReset();
    vi.stubGlobal('fetch', fetchStub);
  });

  it('does not request data before the map reports its area', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EntitiesPage mapStyleUrl="https://tiles.example.com/style" />
      </QueryClientProvider>,
    );

    expect(fetchStub).not.toHaveBeenCalled();
    expect(mapProps().mapStyle).toBe('https://tiles.example.com/style');
  });

  it('requests the visible area and shows a labelled marker for each entity', async () => {
    fetchStub.mockResolvedValue(
      listResponse([
        entity({}),
        entity({
          id: '0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e12',
          name: 'Sensor Gudang',
          type: 'iot_device',
          status: 'maintenance',
        }),
      ]),
    );

    renderLoadedPage();

    const map = within(screen.getByTestId('map'));
    expect(await map.findByRole('button', { name: 'Truk Logistik, Kendaraan, Aktif' })).toHaveClass(
      'bg-status-active',
    );
    expect(
      map.getByRole('button', { name: 'Sensor Gudang, Perangkat IoT, Pemeliharaan' }),
    ).toHaveClass('bg-status-maintenance');
    expect(requestedBbox(0)).toBe('106.000000,-7.000000,108.000000,-6.000000');
  });

  it.each([
    ['vehicle', 'Kendaraan', 'lucide-truck'],
    ['iot_device', 'Perangkat IoT', 'lucide-cpu'],
    ['facility', 'Fasilitas', 'lucide-building-2'],
    ['other', 'Lainnya', 'lucide-map-pin'],
  ] as const)('shows the %s type through its label and icon', async (type, label, iconClass) => {
    fetchStub.mockResolvedValue(listResponse([entity({ type })]));

    renderLoadedPage();

    const marker = await screen.findByRole('button', { name: `Truk Logistik, ${label}, Aktif` });
    expect(marker.querySelector('svg')).toHaveClass(iconClass);
  });

  it.each([
    ['active', 'Aktif', 'bg-status-active'],
    ['maintenance', 'Pemeliharaan', 'bg-status-maintenance'],
    ['inactive', 'Nonaktif', 'bg-status-inactive'],
  ] as const)('shows the %s status through its label and color', async (status, label, color) => {
    fetchStub.mockResolvedValue(listResponse([entity({ status })]));

    renderLoadedPage();

    expect(
      await screen.findByRole('button', { name: `Truk Logistik, Kendaraan, ${label}` }),
    ).toHaveClass(color);
  });

  it('still loads data when the base map fails to load', async () => {
    fetchStub.mockResolvedValue(listResponse([entity({})]));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EntitiesPage mapStyleUrl="https://tiles.example.com/style" />
      </QueryClientProvider>,
    );

    act(() => {
      mapProps().onError(view(106, -7, 108, -6));
    });

    expect(await screen.findByRole('button', { name: /Truk Logistik/ })).toBeInTheDocument();
  });

  it('keeps markers while a new area loads, then requests that area once', async () => {
    fetchStub.mockResolvedValueOnce(listResponse([entity({})]));
    renderLoadedPage();
    await screen.findByRole('button', { name: /Truk Logistik/ });

    let finish: (response: Response) => void = () => undefined;
    fetchStub.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    act(() => {
      mapProps().onMoveEnd(view(0, 0, 5, 5));
      mapProps().onMoveEnd(view(10, 10, 15, 15));
    });

    await waitFor(() => {
      expect(fetchStub).toHaveBeenCalledTimes(2);
    });
    expect(requestedBbox(1)).toBe('10.000000,10.000000,15.000000,15.000000');
    expect(screen.getByRole('button', { name: /Truk Logistik/ })).toBeInTheDocument();

    act(() => {
      finish(listResponse([]));
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Truk Logistik/ })).not.toBeInTheDocument();
    });
  });

  it('asks to zoom in when the area holds more entities than were loaded', async () => {
    fetchStub.mockResolvedValue(listResponse([entity({})], 501));

    renderLoadedPage();

    expect(await screen.findByRole('status')).toHaveTextContent('Perbesar peta');
  });

  it('does not warn when everything in the area was loaded', async () => {
    fetchStub.mockResolvedValue(listResponse([entity({})]));

    renderLoadedPage();

    await screen.findByRole('button', { name: /Truk Logistik/ });
    expect(screen.queryByText(/Perbesar peta/)).not.toBeInTheDocument();
  });

  it('shows an empty message when the area has no entities', async () => {
    fetchStub.mockResolvedValue(listResponse([]));

    renderLoadedPage();

    expect(await screen.findByRole('status')).toHaveTextContent('Belum ada entitas');
    expect(screen.getByTestId('map')).toBeInTheDocument();
  });

  it('shows an error that recovers through the retry button', async () => {
    fetchStub.mockResolvedValueOnce(failureResponse());
    fetchStub.mockResolvedValueOnce(listResponse([entity({})]));

    renderLoadedPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('gagal dimuat');

    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByRole('button', { name: /Truk Logistik/ })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders an entity name containing HTML as plain text', async () => {
    fetchStub.mockResolvedValue(listResponse([entity({ name: '<img src=x onerror=alert(1)>' })]));

    renderLoadedPage();

    expect(
      await screen.findByRole('button', { name: /<img src=x onerror=alert\(1\)>, Kendaraan/ }),
    ).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });
});

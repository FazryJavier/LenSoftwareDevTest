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
  onClick: (event: { lngLat: { lat: number; lng: number } }) => void;
  mapStyle: string;
  cursor?: string;
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

const fetchStub = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();

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

  describe('adding an entity', () => {
    const CREATED = entity({ id: '0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e99', name: 'Baru' });

    function success(data: Entity, code = 200) {
      return new Response(
        JSON.stringify({ code, success: true, message: 'OK.', data, errors: null, meta: null }),
        { status: code },
      );
    }

    const listCalls = () => fetchStub.mock.calls.filter(([url]) => url.includes('/entities?'));

    async function openForm() {
      renderLoadedPage();
      await userEvent.click(screen.getByRole('button', { name: 'Tambah' }));
    }

    it('offers to add an entity when the area is empty', async () => {
      fetchStub.mockResolvedValue(listResponse([]));
      renderLoadedPage();

      await userEvent.click(await screen.findByRole('button', { name: 'Tambah entitas' }));

      expect(screen.getByRole('complementary', { name: 'Tambah entitas' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Tambah entitas' })).not.toBeInTheDocument();
    });

    it('fills the form and shows a draft marker when the map is clicked', async () => {
      fetchStub.mockResolvedValue(listResponse([]));
      await openForm();
      expect(screen.queryByTestId('draft-marker')).not.toBeInTheDocument();
      expect(mapProps().cursor).toBe('crosshair');

      act(() => {
        mapProps().onClick({ lngLat: { lat: -6.5, lng: 107.5 } });
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/Latitude/)).toHaveValue('-6.500000');
      });
      expect(screen.getByLabelText(/Longitude/)).toHaveValue('107.500000');
      expect(await screen.findByTestId('draft-marker')).toBeInTheDocument();
    });

    it('ignores map clicks when the form is closed', async () => {
      fetchStub.mockResolvedValue(listResponse([]));
      renderLoadedPage();

      act(() => {
        mapProps().onClick({ lngLat: { lat: -6.5, lng: 107.5 } });
      });

      await screen.findByText('Belum ada entitas di area ini.');
      expect(screen.queryByTestId('draft-marker')).not.toBeInTheDocument();
      expect(mapProps().cursor).toBeUndefined();
    });

    it('does not open details from a marker while the form is open', async () => {
      fetchStub.mockResolvedValue(listResponse([entity({})]));
      await openForm();

      await userEvent.click(await screen.findByRole('button', { name: /Truk Logistik/ }));

      expect(screen.getByRole('complementary', { name: 'Tambah entitas' })).toBeInTheDocument();
      expect(
        screen.queryByRole('complementary', { name: 'Detail entitas' }),
      ).not.toBeInTheDocument();
    });

    it('saves, reloads the map, shows the new details, and announces success', async () => {
      fetchStub.mockImplementation((url, init) =>
        Promise.resolve(
          init?.method === 'POST'
            ? success(CREATED, 201)
            : url.includes('/entities?')
              ? listResponse(listCalls().length > 1 ? [CREATED] : [])
              : success(CREATED),
        ),
      );
      await openForm();
      await userEvent.type(screen.getByLabelText(/Nama/), 'Baru');
      await userEvent.selectOptions(screen.getByLabelText(/Jenis/), 'vehicle');
      await userEvent.selectOptions(screen.getByLabelText(/Status/), 'active');
      await userEvent.type(screen.getByLabelText(/Latitude/), '-6.9');
      await userEvent.type(screen.getByLabelText(/Longitude/), '107.6');

      await userEvent.click(screen.getByRole('button', { name: 'Simpan' }));

      expect(await screen.findByRole('heading', { name: 'Baru' })).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('berhasil ditambahkan');
      expect(await screen.findByRole('button', { name: /Baru, Kendaraan/ })).toBeInTheDocument();
      expect(
        screen.queryByRole('complementary', { name: 'Tambah entitas' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('draft-marker')).not.toBeInTheDocument();
    });

    it('removes the form and the draft marker when cancelled, returning focus', async () => {
      fetchStub.mockResolvedValue(listResponse([]));
      await openForm();
      act(() => {
        mapProps().onClick({ lngLat: { lat: -6.5, lng: 107.5 } });
      });
      await screen.findByTestId('draft-marker');

      await userEvent.click(screen.getByRole('button', { name: 'Batal' }));
      await userEvent.click(screen.getByRole('button', { name: 'Buang' }));

      expect(
        screen.queryByRole('complementary', { name: 'Tambah entitas' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('draft-marker')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tambah' })).toHaveFocus();
    });
  });

  describe('selecting a marker', () => {
    const SECOND_ID = '0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e12';
    const first = entity({});
    const second = entity({ id: SECOND_ID, name: 'Sensor Gudang' });

    function detailResponse(data: Entity) {
      return new Response(
        JSON.stringify({
          code: 200,
          success: true,
          message: 'OK.',
          data,
          errors: null,
          meta: null,
        }),
      );
    }

    beforeEach(() => {
      fetchStub.mockImplementation((url) =>
        Promise.resolve(
          url.includes('/entities?')
            ? listResponse([first, second])
            : detailResponse(url.includes(SECOND_ID) ? second : first),
        ),
      );
    });

    async function selectFirst() {
      renderLoadedPage();
      const marker = await screen.findByRole('button', { name: /Truk Logistik/ });
      await userEvent.click(marker);
      await screen.findByRole('heading', { name: 'Truk Logistik' });
      return marker;
    }

    it('opens the details and marks the marker as selected', async () => {
      renderLoadedPage();
      const marker = await screen.findByRole('button', { name: /Truk Logistik/ });
      expect(marker).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();

      await userEvent.click(marker);

      expect(await screen.findByRole('heading', { name: 'Truk Logistik' })).toBeInTheDocument();
      expect(marker).toHaveAttribute('aria-pressed', 'true');
      expect(marker).toHaveClass('ring-primary');
    });

    it('switches to another marker without showing the earlier data', async () => {
      await selectFirst();
      let finish: (response: Response) => void = () => undefined;
      fetchStub.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );

      await userEvent.click(screen.getByRole('button', { name: /Sensor Gudang/ }));

      expect(screen.queryByRole('heading', { name: 'Truk Logistik' })).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Memuat detail');
      expect(screen.getByRole('button', { name: /Truk Logistik/ })).toHaveAttribute(
        'aria-pressed',
        'false',
      );

      act(() => {
        finish(detailResponse(second));
      });
      expect(await screen.findByRole('heading', { name: 'Sensor Gudang' })).toBeInTheDocument();
    });

    it('closes from the close button and returns focus to the marker', async () => {
      const marker = await selectFirst();

      await userEvent.click(screen.getByRole('button', { name: 'Tutup detail' }));

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
      expect(marker).toHaveAttribute('aria-pressed', 'false');
      expect(marker).toHaveFocus();
    });

    it('closes with the Escape key and returns focus to the marker', async () => {
      const marker = await selectFirst();

      await userEvent.keyboard('{Escape}');

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
      expect(marker).toHaveFocus();
    });

    it('ignores the Escape key when no panel is open', async () => {
      renderLoadedPage();
      const marker = await screen.findByRole('button', { name: /Truk Logistik/ });
      marker.focus();

      await userEvent.keyboard('{Escape}');

      expect(marker).toHaveFocus();
      expect(marker).toHaveAttribute('aria-pressed', 'false');
    });

    it('keeps the panel open when the map moves', async () => {
      await selectFirst();

      act(() => {
        mapProps().onMoveEnd(view(0, 0, 5, 5));
      });

      await waitFor(() => {
        expect(fetchStub.mock.calls.some(([url]) => url.includes('bbox=0.000000'))).toBe(true);
      });
      expect(screen.getByRole('heading', { name: 'Truk Logistik' })).toBeInTheDocument();
    });
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

import { useEffect, useRef, useState } from 'react';
import { Banner } from '../../components/ui/Banner';
import { toBbox, type MapBounds } from './bbox';
import { useEntities } from './hooks';
import { EntityMap } from './map/EntityMap';

const VIEW_CHANGE_DEBOUNCE_MS = 300;

function useMapArea() {
  const [bbox, setBbox] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  return {
    bbox,
    setNow: (bounds: MapBounds) => {
      setBbox(toBbox(bounds));
    },
    setDebounced: (bounds: MapBounds) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setBbox(toBbox(bounds));
      }, VIEW_CHANGE_DEBOUNCE_MS);
    },
  };
}

export function EntitiesPage({ mapStyleUrl }: { mapStyleUrl: string }) {
  const area = useMapArea();
  const entities = useEntities(area.bbox);

  const loaded = entities.data?.entities ?? [];
  const hasMoreThanLoaded = entities.data !== undefined && entities.data.total > loaded.length;
  const isEmpty = entities.isSuccess && !entities.isPlaceholderData && loaded.length === 0;

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-border bg-surface px-4 py-3">
        <h1 className="text-lg font-semibold">GeoEntity Manager</h1>
      </header>
      <main className="relative flex-1">
        <EntityMap
          styleUrl={mapStyleUrl}
          entities={loaded}
          onViewReady={area.setNow}
          onViewChange={area.setDebounced}
        />
        <div className="absolute inset-x-4 top-4 mx-auto flex max-w-xl flex-col gap-2">
          {entities.isError && (
            <Banner
              tone="error"
              action={
                <button
                  type="button"
                  onClick={() => void entities.refetch()}
                  disabled={entities.isFetching}
                  className="shrink-0 rounded-md border border-border bg-surface px-3 py-2 text-text disabled:opacity-60"
                >
                  Coba lagi
                </button>
              }
            >
              Data entitas gagal dimuat. Periksa koneksi, lalu coba lagi.
            </Banner>
          )}
          {hasMoreThanLoaded && (
            <Banner tone="warning">
              Terlalu banyak entitas di area ini. Perbesar peta untuk melihat semuanya.
            </Banner>
          )}
          {isEmpty && <Banner tone="info">Belum ada entitas di area ini.</Banner>}
        </div>
      </main>
    </div>
  );
}

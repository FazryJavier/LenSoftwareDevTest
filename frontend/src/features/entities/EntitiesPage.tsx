import { useEffect, useRef, useState } from 'react';
import { Banner } from '../../components/ui/Banner';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { toBbox, type MapBounds } from './bbox';
import { EntityDetailPanel } from './components/EntityDetailPanel';
import { EntityForm } from './components/EntityForm';
import type { MapPoint } from './formSchema';
import { useEntities } from './hooks';
import { EntityMap } from './map/EntityMap';
import type { Entity } from './schema';
import { usePanel } from './usePanel';

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
  const panel = usePanel();
  const [pickedPoint, setPickedPoint] = useState<MapPoint | null>(null);
  const [draftLocation, setDraftLocation] = useState<MapPoint | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loaded = entities.data?.entities ?? [];
  const hasMoreThanLoaded = entities.data !== undefined && entities.data.total > loaded.length;
  const isEmpty = entities.isSuccess && !entities.isPlaceholderData && loaded.length === 0;

  const leaveCreate = () => {
    setPickedPoint(null);
    setDraftLocation(null);
  };

  const handleCreated = (entity: Entity) => {
    leaveCreate();
    panel.showDetail(entity.id);
    setToast('Entitas berhasil ditambahkan.');
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <h1 className="text-lg font-semibold">GeoEntity Manager</h1>
        <Button
          variant="primary"
          disabled={panel.isCreating}
          onClick={(event) => {
            panel.openCreate(event.currentTarget);
          }}
        >
          Tambah
        </Button>
      </header>
      <main className="relative flex-1">
        <EntityMap
          styleUrl={mapStyleUrl}
          entities={loaded}
          selectedId={panel.selectedId}
          onSelect={panel.selectEntity}
          draftLocation={draftLocation}
          onMapPick={panel.isCreating ? setPickedPoint : null}
          onViewReady={area.setNow}
          onViewChange={area.setDebounced}
        />
        <div className="absolute inset-x-4 top-4 mx-auto flex max-w-xl flex-col gap-2">
          {entities.isError && (
            <Banner
              tone="error"
              action={
                <Button onClick={() => void entities.refetch()} disabled={entities.isFetching}>
                  Coba lagi
                </Button>
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
          {isEmpty && !panel.isCreating && (
            <Banner
              tone="info"
              action={
                <Button
                  onClick={(event) => {
                    panel.openCreate(event.currentTarget);
                  }}
                >
                  Tambah entitas
                </Button>
              }
            >
              Belum ada entitas di area ini.
            </Banner>
          )}
        </div>
        {panel.selectedId !== null && (
          // The key restarts the panel, so one entity's data never shows under another's.
          <EntityDetailPanel
            key={panel.selectedId}
            entityId={panel.selectedId}
            onClose={panel.close}
          />
        )}
        {panel.isCreating && (
          <EntityForm
            pickedPoint={pickedPoint}
            onDraftLocationChange={setDraftLocation}
            onCreated={handleCreated}
            onCancel={() => {
              leaveCreate();
              panel.close();
            }}
          />
        )}
        {toast !== null && (
          <Toast
            message={toast}
            onDismiss={() => {
              setToast(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

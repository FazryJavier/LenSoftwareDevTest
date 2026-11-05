import { useEffect, useRef, useState } from 'react';
import { Banner } from '../../components/ui/Banner';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { toBbox, type MapBounds } from './bbox';
import { EntityDetailPanel } from './components/EntityDetailPanel';
import { EntityFilters } from './components/EntityFilters';
import { EntityForm } from './components/EntityForm';
import type { MapPoint } from './formSchema';
import { useEntities } from './hooks';
import { EntityMap } from './map/EntityMap';
import type { Entity } from './schema';
import { useEntityFilters } from './useEntityFilters';
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
  const { filters, setFilters } = useEntityFilters();
  const entities = useEntities(area.bbox, filters);
  const isFiltering = filters.type !== null || filters.status !== null;
  const panel = usePanel();
  const [pickedPoint, setPickedPoint] = useState<MapPoint | null>(null);
  const [draftLocation, setDraftLocation] = useState<MapPoint | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);

  const loaded = entities.data?.entities ?? [];
  const hasMoreThanLoaded = entities.data !== undefined && entities.data.total > loaded.length;
  const isEmpty = entities.isSuccess && !entities.isPlaceholderData && loaded.length === 0;

  const leaveForm = () => {
    setPickedPoint(null);
    setDraftLocation(null);
  };

  const handleSaved = (entity: Entity) => {
    setToast(panel.isCreating ? 'Entitas berhasil ditambahkan.' : 'Perubahan berhasil disimpan.');
    leaveForm();
    panel.showDetail(entity.id);
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <h1 className="text-lg font-semibold">GeoEntity Manager</h1>
        <EntityFilters filters={filters} onChange={setFilters} />
        <Button
          ref={addButton}
          variant="primary"
          disabled={panel.isFormOpen}
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
          hiddenId={panel.editingEntity?.id ?? null}
          draftLocation={draftLocation}
          onMapPick={panel.isFormOpen ? setPickedPoint : null}
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
          {isEmpty && !panel.isFormOpen && isFiltering && (
            <Banner
              tone="info"
              action={
                <Button
                  onClick={() => {
                    setFilters({ type: null, status: null });
                  }}
                >
                  Hapus filter
                </Button>
              }
            >
              Tidak ada entitas yang cocok dengan filter di area ini.
            </Banner>
          )}
          {isEmpty && !panel.isFormOpen && !isFiltering && (
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
            onClose={() => {
              panel.close();
            }}
            onEdit={panel.openEdit}
            onDeleted={(message) => {
              setToast(message);
              panel.close(addButton.current);
            }}
          />
        )}
        {panel.isFormOpen && (
          <EntityForm
            {...(panel.editingEntity === null ? {} : { entity: panel.editingEntity })}
            pickedPoint={pickedPoint}
            onDraftLocationChange={setDraftLocation}
            onSaved={handleSaved}
            onCancel={() => {
              leaveForm();
              panel.cancelForm();
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

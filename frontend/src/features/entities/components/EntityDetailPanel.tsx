import { useEffect, useRef, type ReactNode } from 'react';
import { ApiError } from '../../../api/errors';
import { Button } from '../../../components/ui/Button';
import { ENTITY_STATUSES, ENTITY_TYPES } from '../constants';
import { formatCoordinates, formatDateTime } from '../format';
import { useEntity } from '../hooks';
import type { Entity } from '../schema';
import { Panel } from './Panel';

interface EntityDetailPanelProps {
  entityId: string;
  onClose: () => void;
  onEdit: (entity: Entity) => void;
}

export function EntityDetailPanel({ entityId, onClose, onEdit }: EntityDetailPanelProps) {
  const entity = useEntity(entityId);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  const isNotFound = entity.error instanceof ApiError && entity.error.status === 404;

  return (
    <Panel
      label="Detail entitas"
      title={entity.data?.name ?? 'Detail entitas'}
      onClose={onClose}
      closeLabel="Tutup detail"
      closeRef={closeButton}
    >
      {entity.isPending && (
        <p role="status" className="mt-3 text-sm text-text-muted">
          Memuat detail…
        </p>
      )}
      {isNotFound && (
        <p role="alert" className="mt-3 text-sm text-danger">
          Entitas ini tidak ditemukan. Mungkin sudah dihapus.
        </p>
      )}
      {entity.isError && !isNotFound && (
        <div role="alert" className="mt-3 flex flex-col items-start gap-2 text-sm text-danger">
          <span>Detail entitas gagal dimuat. Periksa koneksi, lalu coba lagi.</span>
          <button
            type="button"
            onClick={() => void entity.refetch()}
            disabled={entity.isFetching}
            className="rounded-md border border-border bg-surface px-3 py-2 text-text disabled:opacity-60"
          >
            Coba lagi
          </button>
        </div>
      )}
      {entity.data !== undefined && <EntityDetails entity={entity.data} onEdit={onEdit} />}
    </Panel>
  );
}

function EntityDetails({ entity, onEdit }: { entity: Entity; onEdit: (entity: Entity) => void }) {
  const type = ENTITY_TYPES[entity.type];
  const status = ENTITY_STATUSES[entity.status];
  const attributes = Object.entries(entity.attributes);

  return (
    <div className="mt-3 flex flex-col gap-3 text-sm">
      <p className="flex items-center gap-2">
        <span className={`rounded-md px-2 py-1 text-surface ${status.markerClassName}`}>
          {status.label}
        </span>
        <span className="text-text-muted">{type.label}</span>
      </p>
      <Detail label="Deskripsi">
        {entity.description ?? <span className="text-text-muted">Tidak ada deskripsi.</span>}
      </Detail>
      <Detail label="Koordinat">
        <span className="font-mono">{formatCoordinates(entity.latitude, entity.longitude)}</span>
      </Detail>
      <Detail label="Atribut">
        {attributes.length === 0 ? (
          <span className="text-text-muted">Tidak ada atribut.</span>
        ) : (
          <dl className="flex flex-col gap-1">
            {attributes.map(([key, value]) => (
              <div key={key} className="flex flex-wrap gap-x-2">
                <dt className="text-text-muted">{key}</dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Detail>
      <Detail label="Dibuat">{formatDateTime(entity.created_at)}</Detail>
      <Detail label="Diperbarui">{formatDateTime(entity.updated_at)}</Detail>
      <div>
        <Button
          onClick={() => {
            onEdit(entity);
          }}
        >
          Ubah
        </Button>
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-medium text-text-muted">{label}</h3>
      <div className="break-words">{children}</div>
    </section>
  );
}

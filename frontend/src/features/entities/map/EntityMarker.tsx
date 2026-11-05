import { Marker } from '@vis.gl/react-maplibre';
import { ENTITY_STATUSES, ENTITY_TYPES } from '../constants';
import type { Entity } from '../schema';

export function EntityMarker({ entity }: { entity: Entity }) {
  const type = ENTITY_TYPES[entity.type];
  const status = ENTITY_STATUSES[entity.status];
  const Icon = type.icon;

  return (
    <Marker longitude={entity.longitude} latitude={entity.latitude} anchor="center">
      <button
        type="button"
        aria-label={`${entity.name}, ${type.label}, ${status.label}`}
        className={`flex size-8 items-center justify-center rounded-full border-2 border-surface text-surface shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${status.markerClassName}`}
      >
        <Icon size={16} aria-hidden="true" />
      </button>
    </Marker>
  );
}

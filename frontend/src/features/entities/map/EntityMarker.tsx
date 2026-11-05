import { Marker } from '@vis.gl/react-maplibre';
import { ENTITY_STATUSES, ENTITY_TYPES } from '../constants';
import type { Entity } from '../schema';

interface EntityMarkerProps {
  entity: Entity;
  selected: boolean;
  /** Hidden while a draft marker stands in for it, but kept so focus can return to it. */
  hidden: boolean;
  onSelect: (id: string, trigger: HTMLElement) => void;
}

export function EntityMarker({ entity, selected, hidden, onSelect }: EntityMarkerProps) {
  const type = ENTITY_TYPES[entity.type];
  const status = ENTITY_STATUSES[entity.status];
  const Icon = type.icon;

  return (
    <Marker
      longitude={entity.longitude}
      latitude={entity.latitude}
      anchor="center"
      style={selected ? { zIndex: 1 } : undefined}
    >
      <button
        type="button"
        aria-label={`${entity.name}, ${type.label}, ${status.label}`}
        aria-pressed={selected}
        onClick={(event) => {
          onSelect(entity.id, event.currentTarget);
        }}
        className={`flex items-center justify-center rounded-full border-2 border-surface text-surface shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${status.markerClassName} ${selected ? 'size-10 ring-2 ring-primary' : 'size-8'} ${hidden ? 'invisible' : ''}`}
      >
        <Icon size={16} aria-hidden="true" />
      </button>
    </Marker>
  );
}

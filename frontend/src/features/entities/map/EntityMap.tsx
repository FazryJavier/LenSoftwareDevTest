import { Map, Marker, NavigationControl } from '@vis.gl/react-maplibre';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { MapBounds } from '../bbox';
import type { MapPoint } from '../formSchema';
import type { Entity } from '../schema';
import { EntityMarker } from './EntityMarker';

// The bundler cannot see MapLibre's own reference to its worker, so a build would otherwise
// ship without the file and the base map would stay empty while markers still render.
setWorkerUrl(workerUrl);

// Bounds rather than a fixed zoom, so the whole country fits on any screen size.
const INDONESIA_VIEW = {
  bounds: [
    [95, -11],
    [141, 6],
  ] satisfies [[number, number], [number, number]],
  fitBoundsOptions: { padding: 16 },
};

interface BoundsSource {
  target: {
    getBounds: () => {
      getWest(): number;
      getSouth(): number;
      getEast(): number;
      getNorth(): number;
    };
  };
}

function readBounds({ target }: BoundsSource): MapBounds {
  const bounds = target.getBounds();
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  };
}

interface EntityMapProps {
  styleUrl: string;
  entities: Entity[];
  selectedId: string | null;
  onSelect: (id: string, trigger: HTMLElement) => void;
  hiddenId: string | null;
  draftLocation: MapPoint | null;
  /** When set, clicking the map picks a location and the cursor shows it. */
  onMapPick: ((point: MapPoint) => void) | null;
  /** Called once the map is ready, and after every movement finishes. */
  onViewReady: (bounds: MapBounds) => void;
  onViewChange: (bounds: MapBounds) => void;
}

export function EntityMap({
  styleUrl,
  entities,
  selectedId,
  onSelect,
  hiddenId,
  draftLocation,
  onMapPick,
  onViewReady,
  onViewChange,
}: EntityMapProps) {
  return (
    <Map
      initialViewState={INDONESIA_VIEW}
      mapStyle={styleUrl}
      renderWorldCopies={false}
      attributionControl={{ compact: true }}
      style={{ width: '100%', height: '100%' }}
      {...(onMapPick === null ? {} : { cursor: 'crosshair' })}
      onClick={(event) => {
        onMapPick?.({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
      }}
      onLoad={(event) => {
        onViewReady(readBounds(event));
      }}
      // "load" never fires when the base map fails, but markers can still be shown.
      onError={(event) => {
        onViewReady(readBounds(event));
      }}
      onMoveEnd={(event) => {
        onViewChange(readBounds(event));
      }}
    >
      {/* Same corner as the attribution, so the two stack instead of overlapping on phones. */}
      <NavigationControl position="bottom-right" showCompass={false} />
      {entities.map((entity) => (
        <EntityMarker
          key={entity.id}
          entity={entity}
          selected={entity.id === selectedId}
          hidden={entity.id === hiddenId}
          onSelect={onSelect}
        />
      ))}
      {draftLocation !== null && (
        <Marker
          longitude={draftLocation.longitude}
          latitude={draftLocation.latitude}
          anchor="center"
          draggable
          onDragEnd={(event) => {
            onMapPick?.({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
          }}
          style={{ zIndex: 2 }}
        >
          <span
            data-testid="draft-marker"
            className="block size-8 rounded-full border-2 border-dashed border-primary bg-surface shadow-md"
          />
        </Marker>
      )}
    </Map>
  );
}

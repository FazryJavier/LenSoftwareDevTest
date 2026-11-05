import { Map, NavigationControl } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapBounds } from '../bbox';
import type { Entity } from '../schema';
import { EntityMarker } from './EntityMarker';

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
  /** Called once the map is ready, and after every movement finishes. */
  onViewReady: (bounds: MapBounds) => void;
  onViewChange: (bounds: MapBounds) => void;
}

export function EntityMap({ styleUrl, entities, onViewReady, onViewChange }: EntityMapProps) {
  return (
    <Map
      initialViewState={INDONESIA_VIEW}
      mapStyle={styleUrl}
      renderWorldCopies={false}
      attributionControl={{ compact: true }}
      style={{ width: '100%', height: '100%' }}
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
        <EntityMarker key={entity.id} entity={entity} />
      ))}
    </Map>
  );
}

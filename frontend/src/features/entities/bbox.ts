export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

const clamp = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));

/**
 * Formats map bounds for the API. At low zoom the map can report bounds beyond the valid
 * coordinate ranges, which the API rejects. Returns null when no valid area remains.
 */
export function toBbox({ west, south, east, north }: MapBounds): string | null {
  const minLng = clamp(west, 180);
  const minLat = clamp(south, 90);
  const maxLng = clamp(east, 180);
  const maxLat = clamp(north, 90);

  if (minLng >= maxLng || minLat >= maxLat) {
    return null;
  }
  return [minLng, minLat, maxLng, maxLat].map((value) => value.toFixed(6)).join(',');
}

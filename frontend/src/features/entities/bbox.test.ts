import { describe, expect, it } from 'vitest';
import { toBbox } from './bbox';

describe('toBbox', () => {
  it('orders values as west, south, east, north', () => {
    expect(toBbox({ west: 106.5, south: -7.25, east: 108.75, north: -6 })).toBe(
      '106.500000,-7.250000,108.750000,-6.000000',
    );
  });

  it('limits values beyond the valid coordinate ranges', () => {
    expect(toBbox({ west: -200, south: -95, east: 200, north: 95 })).toBe(
      '-180.000000,-90.000000,180.000000,90.000000',
    );
  });

  it('keeps values exactly on the limits', () => {
    expect(toBbox({ west: -180, south: -90, east: 180, north: 90 })).toBe(
      '-180.000000,-90.000000,180.000000,90.000000',
    );
  });

  it.each([
    ['entirely east of the world', { west: 190, south: 0, east: 200, north: 10 }],
    ['entirely north of the world', { west: 0, south: 91, east: 10, north: 95 }],
    ['without width', { west: 5, south: 0, east: 5, north: 10 }],
  ])('returns null when the area is %s', (_label, bounds) => {
    expect(toBbox(bounds)).toBeNull();
  });
});

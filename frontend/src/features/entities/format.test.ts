import { describe, expect, it } from 'vitest';
import { formatCoordinates, formatDateTime } from './format';

describe('formatDateTime', () => {
  it('shows the date and time in the requested time zone', () => {
    const formatted = formatDateTime('2026-11-05T10:00:00Z', 'Asia/Jakarta');

    expect(formatted).toContain('5 Nov 2026');
    expect(formatted).toContain('17.00');
  });

  it('moves to the next day when the time zone crosses midnight', () => {
    expect(formatDateTime('2026-11-05T20:00:00Z', 'Asia/Jakarta')).toContain('6 Nov 2026');
  });
});

describe('formatCoordinates', () => {
  it('shows latitude first with five decimals', () => {
    expect(formatCoordinates(-6.9175, 107.6191)).toBe('-6.91750, 107.61910');
  });

  it('keeps zero as a value', () => {
    expect(formatCoordinates(0, 0)).toBe('0.00000, 0.00000');
  });
});

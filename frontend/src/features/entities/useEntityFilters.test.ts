import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { readFilters, useEntityFilters } from './useEntityFilters';

describe('readFilters', () => {
  it.each([
    ['no parameters', '', { type: null, status: null }],
    ['both filters', '?type=vehicle&status=active', { type: 'vehicle', status: 'active' }],
    ['one filter', '?status=maintenance', { type: null, status: 'maintenance' }],
    ['an unknown type', '?type=spaceship&status=active', { type: null, status: 'active' }],
    ['an unknown status', '?type=facility&status=lost', { type: 'facility', status: null }],
    ['an empty value', '?type=', { type: null, status: null }],
    ['a list, which the page does not offer', '?type=vehicle,other', { type: null, status: null }],
  ])('handles %s', (_label, search, expected) => {
    expect(readFilters(search)).toEqual(expected);
  });
});

describe('useEntityFilters', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('starts from the URL', () => {
    window.history.replaceState(null, '', '/?type=vehicle');

    const { result } = renderHook(() => useEntityFilters());

    expect(result.current.filters).toEqual({ type: 'vehicle', status: null });
  });

  it('writes filters to the URL without adding history entries', () => {
    const entries = window.history.length;
    const { result } = renderHook(() => useEntityFilters());

    act(() => {
      result.current.setFilters({ type: 'facility', status: 'inactive' });
    });

    expect(result.current.filters).toEqual({ type: 'facility', status: 'inactive' });
    expect(window.location.search).toBe('?type=facility&status=inactive');
    expect(window.history.length).toBe(entries);
  });

  it('removes cleared filters and keeps other parameters', () => {
    window.history.replaceState(null, '', '/?type=vehicle&status=active&other=1');
    const { result } = renderHook(() => useEntityFilters());

    act(() => {
      result.current.setFilters({ type: null, status: null });
    });

    expect(window.location.search).toBe('?other=1');
  });
});

import { describe, expect, it } from 'vitest';
import { readEnv } from './env';

describe('readEnv', () => {
  it('returns the values when they are valid', () => {
    const env = readEnv({ VITE_MAP_STYLE_URL: 'https://tiles.example.com/style' });

    expect(env.VITE_MAP_STYLE_URL).toBe('https://tiles.example.com/style');
  });

  it.each([
    ['missing', {}],
    ['empty', { VITE_MAP_STYLE_URL: '' }],
    ['not a URL', { VITE_MAP_STYLE_URL: 'liberty' }],
    ['unsafe scheme', { VITE_MAP_STYLE_URL: 'javascript:alert(1)' }],
  ])('names the variable when it is %s', (_label, raw) => {
    expect(() => readEnv(raw)).toThrow('VITE_MAP_STYLE_URL');
  });
});

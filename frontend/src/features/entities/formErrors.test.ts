import { describe, expect, it } from 'vitest';
import { ApiError } from '../../api/errors';
import { toFormErrors } from './formErrors';

describe('toFormErrors', () => {
  it('sorts validation errors into fields, attributes, and the form', () => {
    const error = new ApiError(422, 'Validation failed.', [
      { field: 'latitude', code: 'out_of_range', message: 'Latitude out of range.' },
      { field: 'name', code: 'something_new', message: 'Server explanation.' },
      { field: 'attributes.a b', code: 'invalid_format', message: 'Bad key.' },
      { field: 'attributes.c', code: 'too_long', message: 'Too long.' },
      { field: null, code: 'other', message: 'Other problem.' },
    ]);

    expect(toFormErrors(error)).toEqual({
      fields: [
        { name: 'latitude', message: 'Nilainya di luar rentang yang diizinkan.' },
        { name: 'name', message: 'Server explanation.' },
      ],
      attributes: 'Formatnya tidak valid.',
      general: 'Other problem.',
    });
  });

  it.each([
    ['a server error', new ApiError(500, 'Internal server error.', [])],
    ['a network failure', new ApiError(0, 'Tidak dapat menghubungi server.', [])],
    ['an unexpected error', new Error('Unexpected')],
  ])('shows a general message for %s', (_label, error) => {
    const result = toFormErrors(error);

    expect(result.fields).toEqual([]);
    expect(result.general).toContain('gagal disimpan');
  });
});

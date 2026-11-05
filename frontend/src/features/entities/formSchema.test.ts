import { describe, expect, it } from 'vitest';
import {
  entityFormSchema,
  parseDraftLocation,
  type EntityFormValues,
  type EntityPayload,
} from './formSchema';

const VALID: EntityFormValues = {
  name: 'Truk Logistik',
  type: 'vehicle',
  status: 'active',
  description: '',
  attributes: [],
  latitude: '-6.9175',
  longitude: '107.6191',
};

function attributesOfSize(size: number) {
  return Array.from({ length: size }, (_, index) => ({ key: `key_${String(index)}`, value: 'v' }));
}

function pathsOf(values: Partial<EntityFormValues>) {
  const result = entityFormSchema.safeParse({ ...VALID, ...values });
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('entityFormSchema', () => {
  it('turns valid values into the API payload', () => {
    const payload: EntityPayload = entityFormSchema.parse({
      ...VALID,
      name: '  Truk  ',
      description: '  Armada  ',
      attributes: [{ key: 'plate_number', value: 'D 1234 ABC' }],
    });

    expect(payload).toEqual({
      name: 'Truk',
      type: 'vehicle',
      status: 'active',
      description: 'Armada',
      attributes: { plate_number: 'D 1234 ABC' },
      latitude: -6.9175,
      longitude: 107.6191,
    });
  });

  it('sends an empty description as null', () => {
    expect(entityFormSchema.parse({ ...VALID, description: '   ' }).description).toBeNull();
  });

  it.each<[string, Partial<EntityFormValues>]>([
    ['zero coordinates', { latitude: '0', longitude: '0' }],
    ['maximum coordinates', { latitude: '90', longitude: '180' }],
    ['minimum coordinates', { latitude: '-90', longitude: '-180' }],
    ['a name of 100 characters', { name: 'a'.repeat(100) }],
    ['a name of 100 emoji', { name: '😀'.repeat(100) }],
    ['a description of 500 characters', { description: 'a'.repeat(500) }],
    ['20 attributes', { attributes: attributesOfSize(20) }],
    ['an attribute key of 50 characters', { attributes: [{ key: 'k'.repeat(50), value: 'v' }] }],
    ['every allowed key symbol', { attributes: [{ key: 'aZ0_.-', value: 'v' }] }],
    [
      'an attribute value of 200 characters',
      { attributes: [{ key: 'k', value: 'v'.repeat(200) }] },
    ],
    ['an empty attribute value', { attributes: [{ key: 'k', value: '' }] }],
  ])('accepts %s', (_label, values) => {
    expect(pathsOf(values)).toEqual([]);
  });

  it('keeps zero coordinates as numbers', () => {
    const payload = entityFormSchema.parse({ ...VALID, latitude: '0', longitude: '0' });

    expect(payload.latitude).toBe(0);
    expect(payload.longitude).toBe(0);
  });

  it.each<[string, Partial<EntityFormValues>, string]>([
    ['an empty name', { name: '' }, 'name'],
    ['a blank name', { name: '   ' }, 'name'],
    ['a name of 101 characters', { name: 'a'.repeat(101) }, 'name'],
    ['no type', { type: '' }, 'type'],
    ['an unknown type', { type: 'spaceship' }, 'type'],
    ['no status', { status: '' }, 'status'],
    ['an unknown status', { status: 'lost' }, 'status'],
    ['a description of 501 characters', { description: 'a'.repeat(501) }, 'description'],
    ['21 attributes', { attributes: attributesOfSize(21) }, 'attributes'],
    ['an empty attribute key', { attributes: [{ key: '', value: 'v' }] }, 'attributes.0.key'],
    ['a key with a space', { attributes: [{ key: 'a b', value: 'v' }] }, 'attributes.0.key'],
    [
      'a key of 51 characters',
      { attributes: [{ key: 'k'.repeat(51), value: 'v' }] },
      'attributes.0.key',
    ],
    [
      'an attribute value of 201 characters',
      { attributes: [{ key: 'k', value: 'v'.repeat(201) }] },
      'attributes.0.value',
    ],
    [
      'a repeated key',
      {
        attributes: [
          { key: 'k', value: '1' },
          { key: 'k', value: '2' },
        ],
      },
      'attributes.1.key',
    ],
    ['an empty latitude', { latitude: '' }, 'latitude'],
    ['a text latitude', { latitude: 'north' }, 'latitude'],
    ['a latitude with a comma', { latitude: '-6,9' }, 'latitude'],
    ['a hexadecimal latitude', { latitude: '0x10' }, 'latitude'],
    ['a latitude above range', { latitude: '90.1' }, 'latitude'],
    ['a latitude below range', { latitude: '-90.1' }, 'latitude'],
    ['an empty longitude', { longitude: '' }, 'longitude'],
    ['a longitude above range', { longitude: '180.1' }, 'longitude'],
    ['a longitude below range', { longitude: '-180.1' }, 'longitude'],
  ])('rejects %s', (_label, values, path) => {
    expect(pathsOf(values)).toContain(path);
  });
});

describe('parseDraftLocation', () => {
  it('returns the point when both values are valid', () => {
    expect(parseDraftLocation('-6.9', '107.6')).toEqual({ latitude: -6.9, longitude: 107.6 });
  });

  it('accepts zero', () => {
    expect(parseDraftLocation('0', '0')).toEqual({ latitude: 0, longitude: 0 });
  });

  it.each([
    ['', '107.6'],
    ['-6.9', ''],
    ['north', '107.6'],
    ['91', '107.6'],
    ['-6.9', '181'],
  ])('returns null for %s and %s', (latitude, longitude) => {
    expect(parseDraftLocation(latitude, longitude)).toBeNull();
  });
});

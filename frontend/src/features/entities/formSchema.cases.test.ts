import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import sharedCases from '../../../../testdata/validation-cases.json';
import { entityFormSchema, type EntityFormValues } from './formSchema';

// The same file runs in backend/internal/domain/validate_cases_test.go, so a rule that
// differs between the frontend and the backend fails here or there.
const caseSchema = z.object({
  name: z.string(),
  change: z.record(z.string(), z.unknown()),
  field: z.string().optional(),
  frontend: z.boolean().optional(),
});
const casesSchema = z.object({
  valid: z.record(z.string(), z.unknown()),
  accepted: z.array(caseSchema),
  rejected: z.array(caseSchema),
});
const cases = casesSchema.parse(sharedCases);

const repeatSchema = z.object({ $repeat: z.string(), count: z.number() });
const generatedAttributesSchema = z.object({ $attributes: z.number() });

function expand(value: unknown): unknown {
  const repeat = repeatSchema.safeParse(value);
  if (repeat.success) {
    return repeat.data.$repeat.repeat(repeat.data.count);
  }
  const generated = generatedAttributesSchema.safeParse(value);
  if (generated.success) {
    return Object.fromEntries(
      Array.from({ length: generated.data.$attributes }, (_, index) => [
        `key_${String(index)}`,
        'value',
      ]),
    );
  }
  return value;
}

/** A form holds text, so missing values are empty and numbers are typed digits. */
function asFormText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return typeof value === 'number' ? String(value) : '';
}

function asAttributeRows(value: unknown): EntityFormValues['attributes'] {
  const attributes = z.record(z.string(), z.unknown()).parse(value ?? {});
  return Object.entries(attributes).map(([key, inner]) => ({
    key,
    value: asFormText(expand(inner)),
  }));
}

function formValuesFor(change: Record<string, unknown>): EntityFormValues {
  const values = { ...cases.valid, ...change };
  return {
    name: asFormText(expand(values.name)),
    type: asFormText(values.type),
    status: asFormText(values.status),
    description: asFormText(expand(values.description)),
    attributes: asAttributeRows(expand(values.attributes)),
    latitude: asFormText(values.latitude),
    longitude: asFormText(values.longitude),
  };
}

describe('shared validation cases', () => {
  it('has cases to run', () => {
    expect(cases.accepted.length).toBeGreaterThan(0);
    expect(cases.rejected.length).toBeGreaterThan(0);
  });

  it.each(cases.accepted.map((item) => [item.name, item] as const))('accepts %s', (_name, item) => {
    const result = entityFormSchema.safeParse(formValuesFor(item.change));

    expect(result.error?.issues ?? []).toEqual([]);
  });

  const formCases = cases.rejected.filter((item) => item.frontend !== false);

  it.each(formCases.map((item) => [item.name, item] as const))('rejects %s', (_name, item) => {
    const result = entityFormSchema.safeParse(formValuesFor(item.change));

    expect(result.success).toBe(false);
    const roots = result.error?.issues.map((issue) => String(issue.path[0]));
    expect(roots).toContain(item.field?.split('.')[0]);
  });
});

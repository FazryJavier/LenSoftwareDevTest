import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Field';
import { ENTITY_STATUSES, ENTITY_TYPES } from '../constants';
import { entityStatusSchema, entityTypeSchema } from '../schema';
import type { EntityFilters as Filters } from '../useEntityFilters';

interface EntityFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function EntityFilters({ filters, onChange }: EntityFiltersProps) {
  const isActive = filters.type !== null || filters.status !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-36">
        <Select
          aria-label="Filter jenis"
          value={filters.type ?? ''}
          onChange={(event) => {
            const parsed = entityTypeSchema.safeParse(event.target.value);
            onChange({ ...filters, type: parsed.success ? parsed.data : null });
          }}
        >
          <option value="">Semua jenis</option>
          {Object.entries(ENTITY_TYPES).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-36">
        <Select
          aria-label="Filter status"
          value={filters.status ?? ''}
          onChange={(event) => {
            const parsed = entityStatusSchema.safeParse(event.target.value);
            onChange({ ...filters, status: parsed.success ? parsed.data : null });
          }}
        >
          <option value="">Semua status</option>
          {Object.entries(ENTITY_STATUSES).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      {isActive && (
        <Button
          onClick={() => {
            onChange({ type: null, status: null });
          }}
        >
          Reset
        </Button>
      )}
    </div>
  );
}

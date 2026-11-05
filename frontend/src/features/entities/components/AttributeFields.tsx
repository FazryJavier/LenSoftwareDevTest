import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { Field, TextInput } from '../../../components/ui/Field';
import type { EntityFormValues, EntityPayload } from '../formSchema';

export function AttributeFields() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<EntityFormValues, unknown, EntityPayload>();
  const { fields, append, remove } = useFieldArray({ control, name: 'attributes' });

  const groupError =
    errors.attributes?.root?.message ??
    errors.attributes?.message ??
    errors.root?.attributes?.message;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-medium text-text-muted">Atribut</legend>
      {fields.map((field, index) => {
        const keyId = `attribute-${String(index)}-key`;
        const valueId = `attribute-${String(index)}-value`;
        const itemErrors = errors.attributes?.[index];
        return (
          <div key={field.id} className="flex items-start gap-2">
            <Field id={keyId} label="Key" error={itemErrors?.key?.message}>
              <TextInput
                id={keyId}
                error={itemErrors?.key?.message}
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- The form library's path type needs the numeric index.
                {...register(`attributes.${index}.key`)}
              />
            </Field>
            <Field id={valueId} label="Nilai" error={itemErrors?.value?.message}>
              <TextInput
                id={valueId}
                error={itemErrors?.value?.message}
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- The form library's path type needs the numeric index.
                {...register(`attributes.${index}.value`)}
              />
            </Field>
            <Button
              aria-label={`Hapus atribut ${String(index + 1)}`}
              className="mt-5"
              onClick={() => {
                remove(index);
              }}
            >
              ✕
            </Button>
          </div>
        );
      })}
      {groupError !== undefined && <p className="text-xs text-danger">{groupError}</p>}
      <Button
        className="self-start"
        onClick={() => {
          append({ key: '', value: '' });
        }}
      >
        Tambah atribut
      </Button>
    </fieldset>
  );
}

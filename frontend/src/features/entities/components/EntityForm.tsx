import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { Field, Select, TextArea, TextInput } from '../../../components/ui/Field';
import { ENTITY_STATUSES, ENTITY_TYPES } from '../constants';
import { toFormErrors } from '../formErrors';
import {
  EMPTY_ENTITY_FORM,
  entityFormSchema,
  parseDraftLocation,
  type EntityFormValues,
  type EntityPayload,
  type MapPoint,
} from '../formSchema';
import { useCreateEntity } from '../hooks';
import type { Entity } from '../schema';
import { AttributeFields } from './AttributeFields';
import { Panel } from './Panel';

const COORDINATE_DECIMALS = 6;

interface EntityFormProps {
  pickedPoint: MapPoint | null;
  onDraftLocationChange: (point: MapPoint | null) => void;
  onCreated: (entity: Entity) => void;
  onCancel: () => void;
}

export function EntityForm({
  pickedPoint,
  onDraftLocationChange,
  onCreated,
  onCancel,
}: EntityFormProps) {
  const form = useForm<EntityFormValues, unknown, EntityPayload>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: EMPTY_ENTITY_FORM,
  });
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    setError,
    setFocus,
    setValue,
  } = form;
  const create = useCreateEntity();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  const requestCancel = useCallback(() => {
    if (isDirty) {
      setIsConfirmingCancel(true);
    } else {
      onCancel();
    }
  }, [isDirty, onCancel]);

  useEffect(() => {
    setFocus('name');
  }, [setFocus]);

  useEffect(() => {
    if (pickedPoint === null) {
      return;
    }
    const options = { shouldDirty: true, shouldValidate: true };
    setValue('latitude', pickedPoint.latitude.toFixed(COORDINATE_DECIMALS), options);
    setValue('longitude', pickedPoint.longitude.toFixed(COORDINATE_DECIMALS), options);
  }, [pickedPoint, setValue]);

  const [latitude, longitude] = useWatch({ control, name: ['latitude', 'longitude'] });
  useEffect(() => {
    onDraftLocationChange(parseDraftLocation(latitude, longitude));
  }, [latitude, longitude, onDraftLocationChange]);

  useEffect(() => {
    if (isConfirmingCancel) {
      return;
    }
    const cancelOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Otherwise the browser applies this same key press to the dialog it is about to
        // open, which closes the dialog before anyone can see it.
        event.preventDefault();
        requestCancel();
      }
    };
    document.addEventListener('keydown', cancelOnEscape);
    return () => {
      document.removeEventListener('keydown', cancelOnEscape);
    };
  }, [isConfirmingCancel, requestCancel]);

  const submit = handleSubmit((payload) => {
    if (create.isPending) {
      return;
    }
    create.mutate(payload, {
      onSuccess: onCreated,
      onError: (error) => {
        const problems = toFormErrors(error);
        for (const { name, message } of problems.fields) {
          setError(name, { message });
        }
        if (problems.attributes !== null) {
          setError('root.attributes', { message: problems.attributes });
        }
        if (problems.general !== null) {
          setError('root.general', { message: problems.general });
        }
      },
    });
  });

  return (
    <Panel
      label="Tambah entitas"
      title="Tambah entitas"
      onClose={requestCancel}
      closeLabel="Tutup form"
    >
      <FormProvider {...form}>
        <form
          onSubmit={(event) => void submit(event)}
          noValidate
          className="mt-3 flex flex-col gap-3"
        >
          <p className="text-sm text-text-muted">
            Klik peta untuk memilih lokasi, atau ketik koordinatnya.
          </p>
          <Field id="entity-name" label="Nama" required error={errors.name?.message}>
            <TextInput id="entity-name" error={errors.name?.message} {...register('name')} />
          </Field>
          <Field id="entity-type" label="Jenis" required error={errors.type?.message}>
            <Select id="entity-type" error={errors.type?.message} {...register('type')}>
              <option value="">Pilih jenis</option>
              {Object.entries(ENTITY_TYPES).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="entity-status" label="Status" required error={errors.status?.message}>
            <Select id="entity-status" error={errors.status?.message} {...register('status')}>
              <option value="">Pilih status</option>
              {Object.entries(ENTITY_STATUSES).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="entity-latitude" label="Latitude" required error={errors.latitude?.message}>
            <TextInput
              id="entity-latitude"
              inputMode="decimal"
              error={errors.latitude?.message}
              {...register('latitude')}
            />
          </Field>
          <Field id="entity-longitude" label="Longitude" required error={errors.longitude?.message}>
            <TextInput
              id="entity-longitude"
              inputMode="decimal"
              error={errors.longitude?.message}
              {...register('longitude')}
            />
          </Field>
          <Field id="entity-description" label="Deskripsi" error={errors.description?.message}>
            <TextArea
              id="entity-description"
              rows={2}
              error={errors.description?.message}
              {...register('description')}
            />
          </Field>
          <AttributeFields />
          {errors.root?.general?.message !== undefined && (
            <p role="alert" className="text-sm text-danger">
              {errors.root.general.message}
            </p>
          )}
          <div className="flex justify-between gap-2">
            <Button onClick={requestCancel}>Batal</Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {create.isPending ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </form>
      </FormProvider>
      {isConfirmingCancel && (
        <Dialog
          title="Buang perubahan?"
          onDismiss={() => {
            setIsConfirmingCancel(false);
          }}
          actions={
            <>
              <Button
                onClick={() => {
                  setIsConfirmingCancel(false);
                }}
              >
                Lanjut mengisi
              </Button>
              <Button variant="danger" onClick={onCancel}>
                Buang
              </Button>
            </>
          }
        >
          Isi form yang belum disimpan akan hilang.
        </Dialog>
      )}
    </Panel>
  );
}

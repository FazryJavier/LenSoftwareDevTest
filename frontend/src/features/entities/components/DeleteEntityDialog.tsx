import { ApiError } from '../../../api/errors';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { useDeleteEntity } from '../hooks';
import type { Entity } from '../schema';

interface DeleteEntityDialogProps {
  entity: Entity;
  onDismiss: () => void;
  /** Called with the message to announce once the entity is gone, whoever removed it. */
  onDeleted: (message: string) => void;
}

export function DeleteEntityDialog({ entity, onDismiss, onDeleted }: DeleteEntityDialogProps) {
  const remove = useDeleteEntity();

  const confirm = () => {
    remove.mutate(entity.id, {
      onSuccess: () => {
        onDeleted('Entitas berhasil dihapus.');
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 404) {
          onDeleted('Entitas ini sudah tidak ada.');
        }
      },
    });
  };

  return (
    <Dialog
      title="Hapus entitas?"
      onDismiss={onDismiss}
      actions={
        <>
          <Button onClick={onDismiss} disabled={remove.isPending}>
            Batal
          </Button>
          <Button variant="danger" onClick={confirm} disabled={remove.isPending}>
            {remove.isPending ? 'Menghapus…' : 'Hapus'}
          </Button>
        </>
      }
    >
      <p className="break-words">
        <strong>{entity.name}</strong> akan dihapus permanen dan tidak dapat dipulihkan.
      </p>
      {remove.isError && (
        <p role="alert" className="mt-2 text-danger">
          Entitas gagal dihapus. Periksa koneksi, lalu coba lagi.
        </p>
      )}
    </Dialog>
  );
}

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';

const HEALTH_REFETCH_MS = 30_000;

export function BackendStatus() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => apiRequest('/health'),
    retry: false,
    refetchInterval: HEALTH_REFETCH_MS,
  });

  if (health.isPending) {
    return (
      <p role="status" className="text-sm text-text-muted">
        Memeriksa koneksi ke backend…
      </p>
    );
  }

  if (health.isError) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3 text-sm text-danger">
        <span>Backend tidak terhubung. Pastikan semua layanan berjalan, lalu coba lagi.</span>
        <button
          type="button"
          onClick={() => void health.refetch()}
          disabled={health.isFetching}
          className="rounded-md border border-border bg-surface px-3 py-2 text-text disabled:opacity-60"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <p role="status" className="text-sm font-medium text-status-active">
      Backend terhubung
    </p>
  );
}

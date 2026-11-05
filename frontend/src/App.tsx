import { BackendStatus } from './features/system/BackendStatus';

export function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-6">
      <h1 className="text-lg font-semibold">GeoEntity Manager</h1>
      <p className="text-sm text-text-muted">
        Fondasi aplikasi sudah berjalan. Peta dan pengelolaan entitas belum tersedia.
      </p>
      <BackendStatus />
    </main>
  );
}

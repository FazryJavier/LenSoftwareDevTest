import { EntitiesPage } from './features/entities/EntitiesPage';

export function App({ mapStyleUrl }: { mapStyleUrl: string }) {
  return <EntitiesPage mapStyleUrl={mapStyleUrl} />;
}

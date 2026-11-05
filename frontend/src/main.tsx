import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import { readEnv } from './lib/env';

// Fail at startup rather than later, when the map first needs its style URL.
readEnv(import.meta.env);

const root = document.getElementById('root');
if (root === null) {
  throw new Error('Root element #root is missing from index.html.');
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);

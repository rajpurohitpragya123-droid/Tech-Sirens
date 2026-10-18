import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, dehydrate, hydrate } from '@tanstack/react-query';
import App from './SimpleApp';
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 300000, gcTime: 7 * 24 * 60 * 60 * 1000, retry: 1 } },
});
try {
  const cache = localStorage.getItem('khet-query-v2');
  if (cache) hydrate(queryClient, JSON.parse(cache));
} catch {
  /* Ignore a corrupt local cache and use the bundled seed. */
}
queryClient.getQueryCache().subscribe(() => {
  try {
    localStorage.setItem('khet-query-v2', JSON.stringify(dehydrate(queryClient)));
  } catch {
    /* Diary/photo drafts have their own persistent stores. */
  }
});

createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Local persistence still works when SW is unavailable. */
    });
  });
}

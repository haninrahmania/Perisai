'use client';

import { useEffect } from 'react';

export function OfflineBootstrap() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    void navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        registration.active?.postMessage({ type: 'REFRESH_SHELL' });
      })
      .catch(() => {
        // IndexedDB remains usable when offline caching is unavailable.
      });
  }, []);

  return null;
}

'use client';

import { useEffect, useState } from 'react';
import { caseStore, type CaseRecord } from '@/lib/case-store';

export function useActiveCase() {
  const [activeCase, setActiveCase] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void caseStore.getActiveCase()
      .then(setActiveCase)
      .catch(() => setError('Data di perangkat ini belum bisa dibuka. Muat ulang halaman untuk mencoba lagi.'))
      .finally(() => setLoading(false));
  }, []);

  return { activeCase, loading, error };
}

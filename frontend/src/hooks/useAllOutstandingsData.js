import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

async function fetchAllOutstandings() {
  const res = await apiFetch('/api/ledger-remainder?limit=2000');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to load');
  return data;
}

export function useAllOutstandingsData(userId) {
  return useQuery({
    queryKey: ['outstandings-all', userId],
    queryFn: fetchAllOutstandings,
    staleTime: Infinity,
    select: (data) => ({ rows: data.rows ?? [] }),
  });
}

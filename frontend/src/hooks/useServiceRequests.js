import { useCallback } from 'react';
import axios from 'axios';

export function useServiceRequests() {
  const refresh = useCallback(async () => {
    const res = await axios.get('/api/service-requests');
    return res.data?.requests || [];
  }, []);

  return { refresh };
}
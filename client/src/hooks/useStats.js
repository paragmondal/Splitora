import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '../api/stats.api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: getDashboardStats,
    staleTime: 60 * 1000,
  })
}

export default useDashboardStats

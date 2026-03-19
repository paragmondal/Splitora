import { useQuery } from '@tanstack/react-query'
import { getRecentActivity } from '../api/activity.api'

export function useRecentActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: getRecentActivity,
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  })
}

export default useRecentActivity

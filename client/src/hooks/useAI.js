import { useMutation, useQuery } from '@tanstack/react-query'
import { getSplitSuggestion, getSpendingInsights } from '../api/ai.api'

export function useSpendingInsights() {
  return useQuery({ queryKey: ['ai', 'insights'], queryFn: getSpendingInsights, staleTime: 5 * 60 * 1000, retry: false })
}

export function useSplitSuggestion() {
  return useMutation({ mutationFn: getSplitSuggestion })
}

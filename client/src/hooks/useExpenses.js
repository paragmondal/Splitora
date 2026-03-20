import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createExpense, deleteExpense, getGroupExpenses } from '../api/expenses.api'

export function useGroupExpenses(groupId) {
  return useQuery({ queryKey: ['expenses', groupId], queryFn: () => getGroupExpenses(groupId), enabled: Boolean(groupId) })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createExpense,
    onSuccess: (_, variables) => {
      const groupId = variables?.groupId
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['group', groupId] })
        queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
      toast.success('Expense added!')
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to add expense')
  })
}

export function useDeleteExpense(groupId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Expense deleted')
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete expense')
  })
}

export default useGroupExpenses

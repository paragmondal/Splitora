import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExpense, deleteExpense, getGroupExpenses } from "../api/expenses.api";

export function useGroupExpenses(groupId) {
  return useQuery({
    queryKey: ["expenses", groupId],
    queryFn: () => getGroupExpenses(groupId),
    enabled: Boolean(groupId),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExpense,
    onSuccess: (_, variables) => {
      const groupId = variables?.groupId;
      if (!groupId) return;

      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
    },
  });
}

export function useDeleteExpense(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
    },
  });
}

export default useGroupExpenses;

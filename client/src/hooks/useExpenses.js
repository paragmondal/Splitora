import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExpense, deleteExpense, getGroupExpenses, updateExpense } from "../api/expenses.api";

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

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateExpense(id, data),
    onSuccess: (_, variables) => {
      const groupId = variables?.data?.groupId;
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
        queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      }
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

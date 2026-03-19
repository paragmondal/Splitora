import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmSettlement,
  createSettlement,
  getGroupSettlements,
  getSettlementSuggestions,
} from "../api/settlements.api";

export function useSettlementSuggestions(groupId) {
  return useQuery({
    queryKey: ["settlement-suggestions", groupId],
    queryFn: () => getSettlementSuggestions(groupId),
    enabled: Boolean(groupId),
  });
}

export function useGroupSettlements(groupId) {
  return useQuery({
    queryKey: ["settlements", groupId],
    queryFn: () => getGroupSettlements(groupId),
    enabled: Boolean(groupId),
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSettlement,
    onSuccess: (_, variables) => {
      const groupId = variables?.groupId;
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
        queryClient.invalidateQueries({ queryKey: ["settlement-suggestions", groupId] });
      }
    },
  });
}

export function useConfirmSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlement-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
}

/**
 * Composite hook used by SettlementsPage and SettlementSuggestions components.
 * Accepts either { groupId } for suggestion context or { status } for list context.
 */
export default function useSettlements({ groupId, status } = {}) {
  const queryClient = useQueryClient();

  const suggestionsQuery = useQuery({
    queryKey: ["settlement-suggestions", groupId],
    queryFn: () => getSettlementSuggestions(groupId),
    enabled: Boolean(groupId),
  });

  const settlementsQuery = useQuery({
    queryKey: ["settlements", groupId],
    queryFn: () => getGroupSettlements(groupId),
    enabled: Boolean(groupId),
  });

  const confirmSettlementMutation = useMutation({
    mutationFn: confirmSettlement,
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["settlement-suggestions", groupId] });
        queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["settlement-suggestions"] });
        queryClient.invalidateQueries({ queryKey: ["settlements"] });
      }
    },
  });

  const createSettlementMutation = useMutation({
    mutationFn: createSettlement,
    onSuccess: (data) => {
      const gid = data?.data?.settlement?.groupId || groupId;
      if (gid) {
        queryClient.invalidateQueries({ queryKey: ["settlements", gid] });
        queryClient.invalidateQueries({ queryKey: ["settlement-suggestions", gid] });
      }
    },
  });

  return {
    suggestionsQuery,
    settlementsQuery,
    confirmSettlementMutation,
    createSettlementMutation,
  };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmSettlement,
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

export function useConfirmSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmSettlement,
    onSuccess: (_, settlementId, context) => {
      const groupId = context?.groupId;

      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["settlement-suggestions", groupId] });
        queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["settlement-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
}

export default useSettlementSuggestions;

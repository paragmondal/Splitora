import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  addMember,
  createGroup,
  deleteGroup,
  getGroupById,
  getMyGroups,
  leaveGroup,
  updateGroup,
} from "../api/groups.api";

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: getMyGroups,
    staleTime: 30 * 1000,
  });
}

export function useGroup(id) {
  return useQuery({
    queryKey: ["groups", id],
    queryFn: () => getGroupById(id),
    enabled: Boolean(id),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created!");
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateGroup(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["groups", variables.id] });
      }
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useAddMember(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email) => addMember(groupId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export default useGroups;

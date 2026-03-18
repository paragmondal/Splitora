import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { addMember, createGroup, deleteGroup, getGroupById, getMyGroups } from "../api/groups.api";

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: getMyGroups,
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
      toast.success("Group created successfully");
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

export default useGroups;

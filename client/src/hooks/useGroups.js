import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { addMember, createGroup, deleteGroup, generateInviteCode, getGroupById, getMyGroups, joinByInviteCode, leaveGroup } from '../api/groups.api'

export function useGroups() {
  return useQuery({ queryKey: ['groups'], queryFn: getMyGroups, staleTime: 30000 })
}

export function useGroup(id) {
  return useQuery({ queryKey: ['group', id], queryFn: () => getGroupById(id), enabled: Boolean(id) })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); toast.success('Group created!') },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create group')
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); toast.success('Group deleted') },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete group')
  })
}

export function useAddMember(groupId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email) => addMember(groupId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      toast.success('Member added!')
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to add member')
  })
}

export function useLeaveGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); toast.success('Left group') },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to leave group')
  })
}

export function useGenerateInviteCode() {
  return useMutation({
    mutationFn: generateInviteCode,
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to generate invite')
  })
}

export function useJoinByInviteCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: joinByInviteCode,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); toast.success('Joined group!') },
    onError: (err) => toast.error(err?.response?.data?.message || 'Invalid invite link')
  })
}

export default useGroups

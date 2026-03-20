import api from './axios'
export const createGroup = async (data) => (await api.post('/groups', data)).data
export const getMyGroups = async () => (await api.get('/groups')).data
export const getGroupById = async (id) => (await api.get(`/groups/${id}`)).data
export const updateGroup = async (id, data) => (await api.put(`/groups/${id}`, data)).data
export const deleteGroup = async (id) => (await api.delete(`/groups/${id}`)).data
export const addMember = async (groupId, email) => (await api.post(`/groups/${groupId}/members`, { email })).data
export const removeMember = async (groupId, userId) => (await api.delete(`/groups/${groupId}/members/${userId}`)).data
export const leaveGroup = async (groupId) => (await api.post(`/groups/${groupId}/leave`)).data
export const generateInviteCode = async (groupId) => (await api.post(`/groups/${groupId}/invite`)).data
export const joinByInviteCode = async (code) => (await api.post(`/groups/join/${code}`)).data

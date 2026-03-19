import api from './axios'

export const generateInviteCode = async (groupId) => {
  const response = await api.post(`/groups/${groupId}/invite`)
  return response.data
}

export const joinByInviteCode = async (code) => {
  const response = await api.post(`/groups/join/${code}`)
  return response.data
}

export const updateProfile = async (data) => {
  const response = await api.put('/auth/profile', data)
  return response.data
}

export const updatePassword = async (data) => {
  const response = await api.put('/auth/password', data)
  return response.data
}

export default { generateInviteCode, joinByInviteCode, updateProfile, updatePassword }

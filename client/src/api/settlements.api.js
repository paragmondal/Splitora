import api from './axios'
export const getSettlementSuggestions = async (groupId) => (await api.get(`/settlements/suggestions/${groupId}`)).data
export const createSettlement = async (data) => (await api.post('/settlements', data)).data
export const confirmSettlement = async (id) => (await api.put(`/settlements/${id}/confirm`)).data
export const getGroupSettlements = async (groupId) => (await api.get(`/settlements/group/${groupId}`)).data

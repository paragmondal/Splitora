import api from './axios'
export const getSpendingInsights = async () => (await api.get('/ai/insights')).data
export const getSplitSuggestion = async (data) => (await api.post('/ai/split-suggestion', data)).data

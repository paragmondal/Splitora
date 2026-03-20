import api from './axios'
export const getDashboardStats = async () => (await api.get('/stats/dashboard')).data

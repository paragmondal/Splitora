import api from './axios'

export const getRecentActivity = async () => {
  const response = await api.get('/activity')
  return response.data
}

export default { getRecentActivity }

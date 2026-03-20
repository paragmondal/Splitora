import api from './axios'
export const createPaymentOrder = async (data) => (await api.post('/payments/create-order', data)).data
export const verifyPayment = async (data) => (await api.post('/payments/verify', data)).data
export const getPaymentStatus = async (settlementId) => (await api.get(`/payments/status/${settlementId}`)).data

import api from './axios'
export const createExpense = async (data) => (await api.post('/expenses', data)).data
export const getGroupExpenses = async (groupId, params) => (await api.get(`/expenses/group/${groupId}`, { params })).data
export const getExpenseById = async (id) => (await api.get(`/expenses/${id}`)).data
export const updateExpense = async (id, data) => (await api.put(`/expenses/${id}`, data)).data
export const deleteExpense = async (id) => (await api.delete(`/expenses/${id}`)).data

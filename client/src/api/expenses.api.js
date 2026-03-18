import api from "./axios";

export const createExpense = async (data) => {
  const response = await api.post("/expenses", data);
  return response.data;
};

export const getGroupExpenses = async (groupId, params) => {
  const response = await api.get(`/expenses/group/${groupId}`, { params });
  return response.data;
};

export const getExpenseById = async (id) => {
  const response = await api.get(`/expenses/${id}`);
  return response.data;
};

export const updateExpense = async (id, data) => {
  const response = await api.put(`/expenses/${id}`, data);
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};

export default {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};

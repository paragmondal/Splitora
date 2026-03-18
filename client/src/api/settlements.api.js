import api from "./axios";

export const getSettlementSuggestions = async (groupId) => {
  const response = await api.get(`/settlements/suggestions/${groupId}`);
  return response.data;
};

export const createSettlement = async (data) => {
  const response = await api.post("/settlements", data);
  return response.data;
};

export const confirmSettlement = async (id) => {
  const response = await api.put(`/settlements/${id}/confirm`);
  return response.data;
};

export const getGroupSettlements = async (groupId) => {
  const response = await api.get(`/settlements/group/${groupId}`);
  return response.data;
};

export const getMySettlements = async (params) => {
  const response = await api.get("/settlements/me", { params });
  return response.data;
};

export default {
  getSettlementSuggestions,
  createSettlement,
  confirmSettlement,
  getGroupSettlements,
  getMySettlements,
};

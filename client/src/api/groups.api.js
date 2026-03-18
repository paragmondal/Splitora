import api from "./axios";

export const createGroup = async (data) => {
  const response = await api.post("/groups", data);
  return response.data;
};

export const getMyGroups = async () => {
  const response = await api.get("/groups");
  return response.data;
};

export const getGroupById = async (id) => {
  const response = await api.get(`/groups/${id}`);
  return response.data;
};

export const updateGroup = async (id, data) => {
  const response = await api.put(`/groups/${id}`, data);
  return response.data;
};

export const deleteGroup = async (id) => {
  const response = await api.delete(`/groups/${id}`);
  return response.data;
};

export const addMember = async (groupId, email) => {
  const response = await api.post(`/groups/${groupId}/members`, { email });
  return response.data;
};

export const removeMember = async (groupId, userId) => {
  const response = await api.delete(`/groups/${groupId}/members/${userId}`);
  return response.data;
};

export const leaveGroup = async (groupId) => {
  const response = await api.post(`/groups/${groupId}/leave`);
  return response.data;
};

export default {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup,
};

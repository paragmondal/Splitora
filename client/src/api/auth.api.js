import api from "./axios";

export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const logoutUser = async (token) => {
  const response = await api.post("/auth/logout", { refreshToken: token });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const refreshToken = async (token) => {
  const response = await api.post("/auth/refresh", { refreshToken: token });
  return response.data;
};

export default {
  loginUser,
  registerUser,
  logoutUser,
  getMe,
  refreshToken,
};

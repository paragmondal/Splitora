import { create } from "zustand";

const ACCESS_TOKEN_KEY = "splitora_token";
const REFRESH_TOKEN_KEY = "splitora_refresh_token";

const getStoredToken = (key) => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(key);
};

const initialAccessToken = getStoredToken(ACCESS_TOKEN_KEY);
const initialRefreshToken = getStoredToken(REFRESH_TOKEN_KEY);

const useAuthStore = create((set) => ({
  user: null,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: Boolean(initialAccessToken),
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (user) => {
    set({ user });
  },

  setLoading: (isLoading) => {
    set({ isLoading: Boolean(isLoading) });
  },
}));

export default useAuthStore;

// src/store/authStore.ts
import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isLoggedIn: false,
  setTokens: (accessToken, refreshToken) =>
    set({
      accessToken,
      refreshToken,
      isLoggedIn: !!accessToken,
    }),
  logout: () =>
    set({
      accessToken: null,
      refreshToken: null,
      isLoggedIn: false,
    }),
}));

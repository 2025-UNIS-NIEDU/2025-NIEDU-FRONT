// src/store/authStore.ts
import { create } from "zustand";

const isLocalHost = () =>
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const LS_ACCESS = "niedu.accessToken";
const LS_REFRESH = "niedu.refreshToken";

type AuthState = {
  /** 로컬에서만 사용(운영은 HttpOnly 쿠키라 JS가 접근 불가) */
  accessToken: string | null;
  /** 로컬에서만 사용 */
  refreshToken: string | null;
  /** 로컬 토큰 기반 로그인 상태(운영은 /api/user/me로 판별하는 걸 권장) */
  isLoggedIn: boolean;

  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  logout: () => void;
};

const loadFromStorage = () => {
  if (!isLocalHost()) return { accessToken: null, refreshToken: null, isLoggedIn: false };
  const accessToken = localStorage.getItem(LS_ACCESS);
  const refreshToken = localStorage.getItem(LS_REFRESH);
  return { accessToken, refreshToken, isLoggedIn: !!accessToken };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...loadFromStorage(),

  setTokens: (accessToken, refreshToken) =>
    set(() => {
      if (isLocalHost()) {
        if (accessToken) localStorage.setItem(LS_ACCESS, accessToken);
        else localStorage.removeItem(LS_ACCESS);

        if (refreshToken) localStorage.setItem(LS_REFRESH, refreshToken);
        else localStorage.removeItem(LS_REFRESH);
      }

      return {
        accessToken,
        refreshToken,
        isLoggedIn: !!accessToken,
      };
    }),

  logout: () =>
    set(() => {
      if (isLocalHost()) {
        localStorage.removeItem(LS_ACCESS);
        localStorage.removeItem(LS_REFRESH);
      }
      return {
        accessToken: null,
        refreshToken: null,
        isLoggedIn: false,
      };
    }),
}));

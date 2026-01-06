// src/api/axiosInstance.ts
import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";

/**
 * ✅ baseURL 우선순위
 * 1) VITE_API_BASE_URL (권장)
 * 2) 운영 기본값: https://api.niedu-service.com
 */
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://api.niedu-service.com",
  withCredentials: true, // ✅ 운영(쿠키) 환경을 위해 기본 true
});

// 🔎 로컬 판별
const isLocalHost = () =>
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// 🔑 요청 인터셉터
// - 로컬: accessToken을 Authorization 헤더로 실어줌
// - 운영: 쿠키가 자동 포함(withCredentials)
api.interceptors.request.use((config) => {
  if (isLocalHost()) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && !config.headers?.Authorization) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

// 🔁 응답 인터셉터: 401 → 토큰 재발급 시도
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalConfig: any = error.config;

    if (error.response?.status === 401 && originalConfig && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        if (isLocalHost()) {
          // ✅ 로컬은 재발급 API가 "리다이렉트"로 토큰을 다시 넘겨주는 구조라
          // XHR로는 안전하게 갱신 처리하기 애매함 → 브라우저 리다이렉트로 처리
          window.location.href = `${api.defaults.baseURL}/api/auth/reissue-access-token`;
          // 여기 도달하면 페이지가 이동되므로, 요청은 중단
          return Promise.reject(error);
        }

        // ✅ 운영: refreshToken 쿠키를 읽어 accessToken 쿠키를 재세팅 (200 OK)
        await axios.post(
          `${api.defaults.baseURL}/api/auth/reissue-access-token`,
          {},
          { withCredentials: true }
        );

        // 재시도
        return api(originalConfig);
      } catch (reissueErr) {
        console.error("[axiosInstance] 토큰 재발급 실패", reissueErr);
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api;

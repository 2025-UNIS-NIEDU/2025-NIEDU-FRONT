// src/api/axiosInstance.ts
import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";

// 로컬 판별
const isLocalHost = () =>
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

/**
 * ✅ baseURL 전략
 * - 로컬: Vite proxy를 타야 하므로 baseURL을 "" (상대경로)로 둔다.
 * - 운영: 실제 API 도메인 사용 (쿠키 포함)
 */
const api = axios.create({
  baseURL: isLocalHost()
    ? "" // ⭐ 핵심: 로컬에서는 상대경로 -> /api 요청이 프록시를 탐
    : (import.meta.env.VITE_API_BASE_URL || "https://api.niedu-service.com"),
  withCredentials: true,
});

// 요청 인터셉터
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

// 401 처리
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalConfig: any = error.config;

    if (error.response?.status === 401 && originalConfig && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        if (isLocalHost()) {
          // ✅ 로컬: 리다이렉트 방식이면 XHR로 못함 -> 브라우저 이동
          window.location.href = `/api/auth/reissue-access-token`;
          return Promise.reject(error);
        }

        // ✅ 운영: refreshToken 쿠키로 accessToken 쿠키 재세팅
        await axios.post(
          `${api.defaults.baseURL}/api/auth/reissue-access-token`,
          {},
          { withCredentials: true }
        );

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

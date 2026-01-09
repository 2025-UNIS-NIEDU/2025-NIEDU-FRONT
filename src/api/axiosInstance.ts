// src/api/axiosInstance.ts
import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";

const isLocalHost = () =>
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

/**
 * ✅ baseURL 전략
 * - 로컬: Vite proxy 사용 -> baseURL ""
 * - 운영/배포: api 도메인 사용
 */
const api = axios.create({
  baseURL: isLocalHost()
    ? ""
    : (import.meta.env.VITE_API_BASE_URL || "https://api.niedu-service.com"),
  withCredentials: true,
});

// ✅ 요청 인터셉터: "호스트 상관없이" store에 accessToken 있으면 Bearer 붙임
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken && !config.headers?.Authorization) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// 401 처리 (선택: 지금은 우선 유지)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalConfig: any = error.config;

    if (error.response?.status === 401 && originalConfig && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        // 로컬/배포 모두 일단 재요청(백엔드 정책에 맞게 추후 조정 가능)
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

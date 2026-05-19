import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";

const isLocalHost = () =>
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const apiBase =
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalHost() ? "http://localhost:8080" : "https://api.niedu-service.com");

const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
});

// ✅ 요청 인터셉터: store에 accessToken 있으면 Bearer 붙이기
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken && !config.headers?.Authorization) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalConfig: any = error.config;

    if (error.response?.status === 401 && originalConfig && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        if (isLocalHost()) {
          // ✅ 문서 기준: 로컬 재발급은 리다이렉트 방식
          window.location.href = `${apiBase}/api/auth/reissue-access-token`;
          return Promise.reject(error);
        }

        // ✅ 운영: 쿠키 기반 재발급 (리다이렉트 없음)
        await api.post("/api/auth/reissue-access-token");

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

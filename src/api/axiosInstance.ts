// src/api/axiosInstance.ts
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITaE_API_BASE_URL || "https://api.niedu-service.com",
  withCredentials: true, // ✅ 쿠키 항상 포함
});

// 🔑 요청 인터셉터: 로컬 환경이면 accessToken을 헤더에 실어줌
api.interceptors.request.use((config) => {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocal) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && !config.headers["Authorization"]) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  return config;
});

// 🔁 응답 인터셉터: 401 → 토큰 재발급 시도
let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;

    if (error.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        // 토큰 재발급 요청
        await axios.post(
          `${api.defaults.baseURL}/api/auth/reissue-access-token`,
          {},
          { withCredentials: true }
        );

        const isLocal =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        // 로컬에서는 URL 쿼리로 새 accessToken이 돌아올 수도 있어 백엔드 설계에 따라 다름.
        // 여기서는 운영 모드처럼 '쿠키로만 온다'고 가정하고 헤더만 비워서 다시 보냄.
        if (isLocal) {
          // 필요 시 여기서 useAuthStore 갱신 로직 추가 가능
        }

        return api(originalConfig);
      } catch (reissueErr) {
        console.error("토큰 재발급 실패", reissueErr);
        useAuthStore.getState().logout();
        // TODO: 로그인 페이지로 이동 등
      }
    }

    return Promise.reject(error);
  }
);

export default api;

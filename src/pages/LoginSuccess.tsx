// src/pages/LoginSuccess.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "@/api/axiosInstance";

const isLocalHost = () =>
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export default function LoginSuccess() {
  const navigate = useNavigate();
  const { setTokens, logout } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const withdrawPending = params.get("withdrawPending");

    // ✅ 로컬 환경: 쿼리 파라미터에서 토큰 받아서 저장 (localStorage + zustand)
    if (isLocalHost() && accessToken) {
      setTokens(accessToken, refreshToken ?? null);
    }

    // ✅ 탈퇴 유예(복구) 분기
    const run = async () => {
      if (withdrawPending === "true") {
        const ok = window.confirm("탈퇴 유예 계정입니다. 계정을 복구하시겠습니까?");
        if (ok) {
          try {
            await api.post("/api/user/withdraw/cancel");
            window.alert("계정이 복구되었습니다.");
            navigate("/home", { replace: true });
            return;
          } catch (e) {
            console.error("[LoginSuccess] withdraw cancel error:", e);
            window.alert("계정 복구에 실패했습니다. 다시 로그인해주세요.");
            logout();
            try {
              await api.post("/api/auth/logout");
            } catch {}
            navigate("/", { replace: true });
            return;
          }
        } else {
          // 사용자가 복구 거부 → 로그아웃 처리
          logout();
          try {
            await api.post("/api/auth/logout");
          } catch {}
          navigate("/", { replace: true });
          return;
        }
      }

      // 기본: 홈으로 이동
      navigate("/home", { replace: true });
    };

    void run();
  }, [navigate, setTokens, logout]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Pretendard, sans-serif",
      }}
    >
      로그인 처리 중입니다...
    </div>
  );
}

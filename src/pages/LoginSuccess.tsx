// src/pages/LoginSuccess.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "@/api/axiosInstance";

type MeResponse = {
  onboardingCompleted?: boolean;
  hasOnboarded?: boolean;
  isOnboarded?: boolean;
  onboardingStep?: number;
  [key: string]: any;
};

export default function LoginSuccess() {
  const navigate = useNavigate();
  const { setTokens, logout } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const withdrawPending = params.get("withdrawPending");

    // ✅ 운영/로컬 상관없이 쿼리에 토큰이 오면 저장
    if (accessToken) {
      setTokens(accessToken, refreshToken ?? null);
    }

    const safeGo = (path: string) => navigate(path, { replace: true });

    const getOnboardingDone = (me: MeResponse) => {
      if (typeof me.onboardingCompleted === "boolean") return me.onboardingCompleted;
      if (typeof me.hasOnboarded === "boolean") return me.hasOnboarded;
      if (typeof me.isOnboarded === "boolean") return me.isOnboarded;
      if (typeof me.onboardingStep === "number") return me.onboardingStep >= 4;
      return false;
    };

    const fetchMe = async (): Promise<MeResponse | null> => {
      const candidates = ["/api/user/me", "/api/users/me", "/api/user"];
      for (const url of candidates) {
        try {
          const res = await api.get(url);
          const me = (res.data?.data ?? res.data) as MeResponse;
          if (me) return me;
        } catch {
          // next
        }
      }
      return null;
    };

    const run = async () => {
      if (withdrawPending === "true") {
        const ok = window.confirm("탈퇴 유예 계정입니다. 계정을 복구하시겠습니까?");
        if (!ok) {
          safeGo("/");
          return;
        }
        try {
          await api.post("/api/user/withdraw/cancel");
          window.alert("계정이 복구되었습니다.");
        } catch (e) {
          console.error("[LoginSuccess] withdraw cancel error:", e);
          window.alert("계정 복구에 실패했습니다. 다시 로그인해주세요.");
          logout();
          try {
            await api.post("/api/auth/logout");
          } catch {}
          safeGo("/");
          return;
        }
      }

      const me = await fetchMe();
      if (!me) {
        safeGo("/onboarding/4");
        return;
      }

      const done = getOnboardingDone(me);
      safeGo(done ? "/home" : "/onboarding/4");
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

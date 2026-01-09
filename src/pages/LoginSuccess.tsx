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

    // ✅ 핵심: 로컬이든 배포든 accessToken이 쿼리로 오면 저장
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
          // 다음 후보
        }
      }
      return null;
    };

    const run = async () => {
      // ✅ 탈퇴 유예 처리(있으면)
      if (withdrawPending === "true") {
        const ok = window.confirm("탈퇴 유예 계정입니다. 계정을 복구하시겠습니까?");
        if (ok) {
          try {
            await api.post("/api/user/withdraw/cancel");
            window.alert("계정이 복구되었습니다.");
          } catch (e) {
            console.error("[LoginSuccess] withdraw cancel error:", e);
            window.alert("계정 복구에 실패했습니다. 다시 로그인해주세요.");
            logout();
            safeGo("/");
            return;
          }
        } else {
          logout();
          safeGo("/");
          return;
        }
      }

      const me = await fetchMe();

      // ✅ 중요: me를 못 받아오더라도, 지금은 플로우 테스트를 위해 홈으로 보내고 싶으면 여기 바꾸면 됨
      // - 원래 로직: 온보딩으로 보내기(안전)
      // - 지금 목표: 홈 API 확인 -> 홈으로 보내기
      if (!me) {
        // safeGo("/onboarding/topic"); // 안전한 선택
        safeGo("/home"); // ✅ 지금은 홈 확인 목적이면 이게 편함
        return;
      }

      const done = getOnboardingDone(me);
      safeGo(done ? "/home" : "/onboarding/topic");
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

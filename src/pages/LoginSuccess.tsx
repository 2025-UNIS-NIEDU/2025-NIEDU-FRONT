// src/pages/LoginSuccess.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "@/api/axiosInstance";

const isLocalHost = () =>
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

type MeResponse = {
  // 아래 필드들 중 하나로 올 가능성이 큼 (백엔드 스펙에 맞게 최종 1개로 정리하면 됨)
  onboardingCompleted?: boolean;
  hasOnboarded?: boolean;
  isOnboarded?: boolean;

  // 만약 "온보딩 단계"로 주면 (예: 0~4)
  onboardingStep?: number;

  // 기타…
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

    // ✅ 로컬 환경: 쿼리 파라미터에서 토큰 받아서 저장
    if (isLocalHost() && accessToken) {
      setTokens(accessToken, refreshToken ?? null);
    }

    const safeGo = (path: string) => navigate(path, { replace: true });

    const getOnboardingDone = (me: MeResponse) => {
      // 1) boolean 형태
      if (typeof me.onboardingCompleted === "boolean") return me.onboardingCompleted;
      if (typeof me.hasOnboarded === "boolean") return me.hasOnboarded;
      if (typeof me.isOnboarded === "boolean") return me.isOnboarded;

      // 2) step 형태: 4 이상이면 완료라고 가정 (프로젝트 기준에 맞게 조정)
      if (typeof me.onboardingStep === "number") return me.onboardingStep >= 4;

      // 3) 아무것도 없으면 "미완료"로 처리(안전)
      return false;
    };

    const fetchMe = async (): Promise<MeResponse | null> => {
      // ✅ 프로젝트마다 /api/user/me, /api/users/me, /api/user 등이 갈림
      // 여기서 하나만 맞으면 됨.
      const candidates = ["/api/user/me", "/api/users/me", "/api/user"];
      for (const url of candidates) {
        try {
          const res = await api.get(url);
          // 보통 ApiResponse 형태면 res.data.data일 수 있음
          const me = (res.data?.data ?? res.data) as MeResponse;
          if (me) return me;
        } catch {
          // 다음 후보로
        }
      }
      return null;
    };

    const run = async () => {
      // ✅ 탈퇴 유예(복구) 먼저 처리
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
            try {
              await api.post("/api/auth/logout");
            } catch {}
            safeGo("/");
            return;
          }
        } else {
          logout();
          try {
            await api.post("/api/auth/logout");
          } catch {}
          safeGo("/");
          return;
        }
      }

      // ✅ 여기서부터: 온보딩 여부 체크 후 라우팅
      const me = await fetchMe();

      // me를 못 받아오면 일단 온보딩으로 보내는 게 UX상 안전 (원하면 /home으로 바꿔도 됨)
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

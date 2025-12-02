// src/pages/LoginSuccess.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function LoginSuccess() {
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const withdrawPending = params.get("withdrawPending");

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // 🔹 로컬 환경: 쿼리 파라미터에서 토큰 받아서 store에 저장
    if (isLocal && accessToken) {
      setTokens(accessToken, refreshToken ?? null);
    }

    // 🔹 일단 withdrawPending은 지금은 무시하고 바로 홈으로 이동
    //   (나중에 복구 팝업 필요하면 여기서 분기 추가하면 됨)
    navigate("/home", { replace: true });
  }, [navigate, setTokens]);

  // 🔥 이게 없어서 에러 났던 거!
  // 컴포넌트는 반드시 JSX를 return 해야 함.
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

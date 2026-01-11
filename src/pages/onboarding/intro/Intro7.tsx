import { useState } from "react";
import base from "./IntroBase.module.css";
import styles from "./Intro7.module.css";
import IntroHeader from "../components/IntroHeader";

export default function Intro7() {
  const [loading, setLoading] = useState(false);

  const handleKakaoStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    // ✅ 혹시 form 안에 있어도 submit 안 되게
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

    const fallback =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:8080"
        : "https://api.niedu-service.com";

    const apiBase = envBase || fallback;

    // ✅ 절대 XHR 금지: 문서 네비게이션으로 이동
    const url = `${apiBase}/oauth2/authorization/kakao`;

    // assign이 가장 명확하게 "페이지 이동"임
    window.location.assign(encodeURI(url));
  };

  return (
    <div className={base.viewport}>
      <div className={base.container}>
        <IntroHeader total={7} active={7} />

        <div className={base.content}>
          <div className={styles.illWrap}>
            <img className={styles.ill} src="/onboarding/bunny.png" alt="bunny" />
          </div>

          <div className={styles.textArea}>
            <p className={styles.p}>
              이제 NIEdu와 함께
              <br />
              뉴스를 읽어봐요!
            </p>
          </div>

          <button
            type="button"
            className={`${base.bottomBtn} ${base.kakaoBtn}`}
            onClick={handleKakaoStart}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "이동 중..." : "카카오로 시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

import base from "./IntroBase.module.css";
import styles from "./Intro7.module.css";
import IntroHeader from "../components/IntroHeader";

export default function Intro7() {
  const handleKakaoStart = () => {
    // ✅ 문서 기준: 로그인 시작은 무조건 BE /oauth2/authorization/kakao
    const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;

    // env 없을 때 안전 fallback
    const fallback =
      window.location.hostname === "localhost"
        ? "http://localhost:8080"
        : "https://api.niedu-service.com";

    const apiBase = envBase || fallback;

    // cache 방지용으로 timestamp 붙여도 됨(선택)
    window.location.href = `${apiBase}/oauth2/authorization/kakao`;
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

          <button className={`${base.bottomBtn} ${base.kakaoBtn}`} onClick={handleKakaoStart}>
            카카오로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

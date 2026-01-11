import { useNavigate } from "react-router-dom";
import base from "./IntroBase.module.css";
import styles from "./Intro7.module.css";
import IntroHeader from "../components/IntroHeader";

export default function Intro7() {
  const nav = useNavigate();

  const handleKakaoStart = () => {
    // TODO: 카카오 로그인 시작 로직 연결
    // 예: window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/kakao`
    nav("/onboarding/topic"); // 임시: 다음 단계로
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

import { useNavigate } from "react-router-dom";
import styles from "./OnboardingIntro1.module.css";

export default function OnboardingIntro3() {
  const navigate = useNavigate();

const handleKakaoLogin = () => {
  window.location.href = "https://api.niedu-service.com/oauth2/authorization/kakao";
};

  const handleSkip = () => navigate("/onboarding/topic");

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 상단 영역: 인디케이터 3번째 활성 */}
        <div className={styles.top}>
          <div className={styles.indicator}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={`${styles.dot} ${styles.active}`}></div>
          </div>
          <button className={styles.skip} onClick={handleSkip}>
            건너뛰기 &gt;
          </button>
        </div>
<img
  src="/icons/Frame 3.svg"
  alt="온보딩1"
  className={styles.illustrationONBoarding3}
/>

        {/* 본문 문구 (하단에 가깝게) */}
        <div className={styles.finalMsg}>
          <p>
            이제 <strong>NIEdu</strong>와 함께
            <br />
            뉴스를 읽어보세요!
          </p>
        </div>

        {/* 하단 카카오 버튼 */}
        <button className={`${styles.nextButton} ${styles.kakaoButton}`} onClick={handleKakaoLogin}>
          카카오로 시작하기
        </button>
      </div>
    </div>
  );
}

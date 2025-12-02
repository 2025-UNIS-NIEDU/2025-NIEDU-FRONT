import { useNavigate } from "react-router-dom";
import styles from "./OnboardingIntro1.module.css";

export default function OnboardingIntro4() {
  const navigate = useNavigate();

  const handleComplete = () => {
    // 다음 단계: 토픽 선택 또는 홈으로 이동
    navigate("/onboarding/topic"); // 필요 시 "/home"으로 바꿔도 OK
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 인디케이터 없음 (디자인 기준) */}

        {/* 본문: 가운데/하단 배치 */}
        <div className={styles.centerMsg}>
          <h1 className={styles.welcomeTitle}>환영합니다!</h1>
          <p className={styles.welcomeSubtitle}>
            이제 마지막 단계예요.
            <br />
            설정을 완료하고 <strong>NIEdu</strong>를 시작하세요.
          </p>
        </div>

        {/* 하단 버튼 (옅은 비활성 느낌) */}
        <button
          className={`${styles.completeButton} ${styles.completeButtonGhost}`}
          onClick={handleComplete}
        >
          설정 완료하기
        </button>
      </div>
    </div>
  );
}

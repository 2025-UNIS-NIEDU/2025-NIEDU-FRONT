import { useNavigate } from "react-router-dom";
import styles from "./OnboardingIntro1.module.css";

export default function OnboardingIntro2() {
  const navigate = useNavigate();

  const handleSkip = () => navigate("/onboarding/topic");
  const handleNext = () => navigate("/onboarding/3"); // 다음 화면 준비되면 연결

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 상단 영역 */}
        <div className={styles.top}>
          <div className={styles.indicator}>
            <div className={styles.dot}></div>
            <div className={`${styles.dot} ${styles.active}`}></div>
            <div className={styles.dot}></div>
          </div>
          <button className={styles.skip} onClick={handleSkip}>
            건너뛰기 &gt;
          </button>
        </div>
     {/* 중앙 일러스트 */}
<img
  src="/icons/Frame 1.svg"
  alt="온보딩1"
  className={styles.illustrationON2}
/>
        {/* 본문 텍스트 */}
        <div className={styles.descArea}>
          <h2 className={styles.descHeading}>뉴스, 어렵게만 느껴지셨나요?</h2>

          <p className={styles.descParagraph}>
            <strong>NIEdu</strong>는 뉴스를 쉽게 풀어
            <br />
            문해력과 시사상식을 쌓을 수 있도록
            <br />
            도와주는 학습 서비스예요.
          </p>

          <p className={styles.descParagraph}>
            요약·퀴즈·용어 카드로 가볍게 배우고,
            <br />
            캘린더와 리포트로 습관을 만들며
            <br />
            다른 사람들과 의견도 나눌 수 있어요.
          </p>
        </div>

        {/* 하단 버튼 (스크린샷처럼 옅은 비활성 느낌) */}
        <button className={`${styles.nextButton} ${styles.nextButtonGhost}`} onClick={handleNext}>
          다음으로
        </button>
      </div>
    </div>
  );
}

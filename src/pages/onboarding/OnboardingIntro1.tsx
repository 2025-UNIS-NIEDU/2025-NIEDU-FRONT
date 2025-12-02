import { useNavigate } from "react-router-dom";
import styles from "./OnboardingIntro1.module.css";

export default function OnboardingIntro1() {
  const nav = useNavigate();

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 상단 */}
        <div className={styles.top}>
          <div className={styles.indicator}>
            <div className={`${styles.dot} ${styles.active}`} />
            <div className={styles.dot} />
            <div className={styles.dot} />
          </div>
          <button className={styles.skip} onClick={() => nav("/onboarding/topic")}>
            건너뛰기 &gt;
          </button>
        </div>

        {/* 중앙 일러스트 */}
     {/* 중앙 일러스트 */}
<img
  src="/icons/Frame 2 (1).svg"
  alt="온보딩1"
  className={styles.illustration}
/>


        {/* 본문 */}
        <div className={styles.textArea}>
          <h2>뉴스와 학습을 연결하다</h2>
          <h1>NI<span>Edu</span></h1>
        </div>

        {/* 하단 버튼 */}
        <button className={styles.nextButton} onClick={() => nav("/onboarding/2")}>
          다음으로
        </button>
      </div>
    </div>
  );
}

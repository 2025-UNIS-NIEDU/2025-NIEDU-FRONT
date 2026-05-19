import { useLocation, useNavigate } from "react-router-dom";
import styles from "./EduResult.module.css";

type EduResultState = {
  streak?: number;
  durationLabel?: string;
};

const STORAGE_KEY = "NIEDU_STEP_RUNNER_STATE_V1";

export default function EduResult() {
  const nav = useNavigate();
  const location = useLocation();

  const { streak = 2, durationLabel = "6분 2초" } =
    (location.state as EduResultState) || {};

  const handleFinish = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    nav("/learn");
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 헤더 */}
        <header className={styles.header}>
          <img
            src="/icons/fluent_ios-arrow.svg"
            alt="back"
            className={styles.backBtn}
            onClick={() => nav(-1)}
          />
          
        </header>

        {/* 콘텐츠 */}
        <div className={styles.content}>
          <img
            src="/icons/happybunny.svg"
            alt="결과 마스코트"
            className={styles.mascot}
          />

          <h2 className={styles.title}>지식 적립!</h2>

          <div className={styles.streakBadge}>
            <img src="/icons/solar_fire-bold-duotone.svg" alt="" />
            <span>{streak}일 연속 학습!</span>
          </div>

          <div className={styles.timeBadge}>
            <img src="/icons/Vector.svg" alt="" />
            <span>{durationLabel}</span>
          </div>
        </div>

        {/* 하단 버튼 */}
        <button className={styles.finishBtn} onClick={handleFinish}>
          학습 종료하기
        </button>
      </div>
    </div>
  );
}

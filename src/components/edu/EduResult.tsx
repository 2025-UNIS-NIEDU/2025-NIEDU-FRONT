// pages/edu/EduResult.tsx
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./EduResult.module.css";

type EduResultState = {
  streak?: number;        // 연속 학습 일수
  durationLabel?: string; // "6분 2초" 이런 포맷
};

export default function EduResult() {
  const nav = useNavigate();
  const location = useLocation();

  const { streak = 2, durationLabel = "6분 2초" } =
    (location.state as EduResultState) || {};

  const handleFinish = () => {
    nav("/learn");
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 상단 헤더 */}
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => nav(-1)}
            aria-label="뒤로가기"
          >
            <img src="/icons/ep_arrow-up-bold.svg" alt="" />
          </button>
          <h1 className={styles.headerTitle}>
            
          </h1>
          <div className={styles.headerRightSpace} />
        </header>

        {/* 중앙 내용 */}
        <div className={styles.content}>
          <img
            src="/icons/Frame 3.svg"
            alt="학습 마스코트"
            className={styles.mascot}
          />

          <h2 className={styles.title}>지식 적립!</h2>

          <div className={styles.streakBadge}>
            <img
              src="/icons/solar_fire-bold-duotone.svg"
              alt=""
              className={styles.badgeIcon}
            />
            <span>{streak}일 연속 학습!</span>
          </div>

          <div className={styles.timeBadge}>
            <img
              src="/icons/Vector.svg"
              alt=""
              className={styles.badgeIcon}
            />
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

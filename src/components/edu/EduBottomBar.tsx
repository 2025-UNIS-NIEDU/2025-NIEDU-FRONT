// src/components/edu/EduBottomBar.tsx
import { useState } from "react";
import styles from "./EduBottomBar.module.css";
import EduQuitConfirm from "./EduQuitConfirm";

interface EduBottomBarProps {
  onPrev?: () => void;
  onNext?: () => void;
  onQuit?: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
}

export default function EduBottomBar({
  onPrev,
  onNext,
  onQuit,
  disablePrev,
  disableNext,
}: EduBottomBarProps) {
  const [showQuit, setShowQuit] = useState(false);

  const handleQuitClick = () => setShowQuit(true);
  const handleConfirmQuit = () => {
    setShowQuit(false);
    onQuit?.();
  };
  const handleCancelQuit = () => setShowQuit(false);

  return (
    <>
      <nav className={styles.nav} aria-label="학습 하단 내비게이션">
        <div className={styles.bar}>
          {/* 이전 */}
          <button
            type="button"
            className={`${styles.sideBtn} ${disablePrev ? styles.disabled : ""}`}
            onClick={onPrev}
            disabled={disablePrev}
          >
            <img
              src="/icons/maki_arrow.svg"
              alt="이전"
              className={`${styles.icon} ${styles.leftIcon}`}
            />
            <span className={styles.label}>이전</span>
          </button>

          {/* 종료 */}
          <button
            type="button"
            className={styles.centerBtn}
            onClick={handleQuitClick}
          >
            <img
              src="/icons/solar_exit-bold-duotone.svg"
              alt="종료"
              className={styles.centerIcon}
            />
            <span className={styles.centerLabel}>종료</span>
          </button>

          {/* 다음 */}
          <button
            type="button"
            className={`${styles.sideBtn} ${disableNext ? styles.disabled : ""}`}
            onClick={onNext}
            disabled={disableNext}
          >
            <img
              src="/icons/maki_arrow.svg"
              alt="다음"
              className={`${styles.icon} ${styles.rightIcon}`}
            />
            <span className={styles.label}>다음</span>
          </button>
        </div>
      </nav>

      {showQuit && (
        <EduQuitConfirm onConfirm={handleConfirmQuit} onCancel={handleCancelQuit} />
      )}
    </>
  );
}

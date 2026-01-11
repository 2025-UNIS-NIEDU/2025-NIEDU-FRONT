import styles from "./IntroHeader.module.css";

type Props = {
  total: number;     // 7
  active: number;    // 1~7
  onSkip?: () => void;
};

export default function IntroHeader({ total, active, onSkip }: Props) {
  return (
    <div className={styles.top}>
      <div className={styles.dots} aria-label="onboarding progress">
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i + 1 === active;
          return (
            <span
              key={i}
              className={`${styles.dot} ${isActive ? styles.active : ""}`}
            />
          );
        })}
      </div>

      {onSkip ? (
        <button className={styles.skip} onClick={onSkip}>
          건너뛰기 &gt;
        </button>
      ) : (
        <div className={styles.skipPlaceholder} />
      )}
    </div>
  );
}

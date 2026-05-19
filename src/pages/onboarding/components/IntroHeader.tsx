import styles from "./IntroHeader.module.css";

type Props = {
  total: number;
  active: number;
  onSkip?: () => void;
  theme?: "dark" | "light"; // ✅ 추가
};

export default function IntroHeader({
  total,
  active,
  onSkip,
  theme = "light",
}: Props) {
  return (
    <div className={styles.top}>
      <div
        className={`${styles.dots} ${
          theme === "dark" ? styles.dark : styles.light
        }`}
      >
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
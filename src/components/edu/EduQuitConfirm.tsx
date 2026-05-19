import styles from "./EduQuitConfirm.module.css";

export default function EduQuitConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <p className={styles.title}>정말로 학습을 종료하시겠어요?</p>

        <img
          src="/icons/sadbunny.svg"
          alt="슬픈 캐릭터"
          className={styles.mascot}
        />

        <div className={styles.actions}>
          {/* 왼쪽: 종료 */}
          <button
            type="button"
            className={styles.quitButton}
            onClick={onConfirm}
          >
            <span className={styles.btnLine1}>네</span>
            <span className={styles.btnLine2}>종료할게요</span>
          </button>

          {/* 오른쪽: 이어하기 */}
          <button
            type="button"
            className={styles.continueButton}
            onClick={onCancel}
          >
            <span className={styles.btnLinerr}>아니요</span>
            <span className={styles.btnLinerr}>이어할게요</span>
          </button>
        </div>
      </div>
    </div>
  );
}

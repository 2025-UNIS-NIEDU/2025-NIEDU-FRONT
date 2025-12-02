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
        <img src="/mascots/edu-sad.png" alt="" className={styles.mascot}/>
        <p className={styles.title}>정말로 학습을 종료하시겠어요?</p>
        <div className={styles.actions}>
          <button className={styles.primary} onClick={onConfirm}>네, 종료할래요</button>
          <button className={styles.secondary} onClick={onCancel}>아니요, 이어할게요</button>
        </div>
      </div>
    </div>
  );
}

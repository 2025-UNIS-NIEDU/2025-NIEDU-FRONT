import styles from "./EduArticleViewer.module.css";

export default function EduArticleViewer({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.sheet}>
        <div className={styles.sheetHeader}>
          <button onClick={onClose} aria-label="닫기">✕</button>
          <span>원문 보기</span>
          <a href={url} rel="noopener noreferrer" target="_blank" className={styles.external}>
            새 탭
          </a>
        </div>
        {/* iFrame 방식: 외부 뉴스 페이지 임베드 */}
        <iframe title="기사 원문" src={url} className={styles.iframe} />
      </div>
    </div>
  );
}

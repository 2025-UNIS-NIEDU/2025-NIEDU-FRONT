import { useState } from "react";
import EduArticleViewer from "./EduArticleViewer";
import styles from "./EduTopBar.module.css";

export default function EduTopBar({
  title = "뉴스 학습",
  onBack,
  articleUrl,
}: {
  title?: string;
  onBack?: () => void;
  articleUrl?: string; // 원문 링크(있으면 버튼 노출)
}) {
  const [openArticle, setOpenArticle] = useState(false);

  return (
    <>
      <header className={styles.bar}>
        <button aria-label="뒤로가기" onClick={onBack} className={styles.iconBtn}>←</button>
        <h1 className={styles.title}>{title}</h1>
        {articleUrl ? (
          <button
            className={styles.linkBtn}
            onClick={() => setOpenArticle(true)}
            aria-label="원문보기"
          >
            원문보기
          </button>
        ) : (
          <span className={styles.spacer} />
        )}
      </header>

      {openArticle && (
        <EduArticleViewer url={articleUrl!} onClose={() => setOpenArticle(false)} />
      )}
    </>
  );
}

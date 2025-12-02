// src/pages/article/session/I/StepI001.tsx

import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import type { StepMeta } from "@/pages/article/ArticlePrepare";
import styles from "./StepI001.module.css";

type Props = {
  articleId?: string;
  articleUrl?: string;
  stepMeta?: StepMeta; // 🔹 /start 응답에서 넘어오는 메타
};

type ArticleReadingContent = {
  thumbnailUrl: string;
  headline: string;
  publisher: string;
  publishedAt: string;
  sourceUrl: string;
};

type LocationState = {
  articleId?: string;
  articleTitle?: string;
  articleSource?: string;
  articlePublishedAt?: string;
  articleImageUrl?: string;
  articleUrl?: string;
  nextStepPath?: string;
};

export default function StepI001({ articleId, articleUrl, stepMeta }: Props) {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: LocationState };

  // 🔹 ARTICLE_READING content 파싱
  const content = stepMeta?.content as ArticleReadingContent | undefined;

  const thumbnailUrl =
    content?.thumbnailUrl ?? state?.articleImageUrl ?? "";
  const headline =
    content?.headline ?? state?.articleTitle ?? "선택한 기사 제목이 없습니다.";
  const publisher = content?.publisher ?? state?.articleSource ?? "언론사";
  const publishedAt =
    content?.publishedAt ?? state?.articlePublishedAt ?? "발행일";
  const sourceUrl =
    content?.sourceUrl ?? articleUrl ?? state?.articleUrl ?? "";

  const handleOpenArticle = () => {
    if (!sourceUrl) return;
    window.open(sourceUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrev = () => nav(-1);

  const handleNext = () => {
    // 👉 다음 스텝에서도 원문 URL이 필요할 수 있으니 넘겨줌
nav("/nie/session/I/step/002", {
  state: {
    articleId: articleId ?? state?.articleId,
    articleUrl: sourceUrl ?? articleUrl ?? state?.articleUrl,
  },
});
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <h1 className={styles.heading}>기사 원문 읽기</h1>

        {/* 기사 카드 */}
        <button
          type="button"
          className={styles.articleCard}
          onClick={handleOpenArticle}
        >
          <div className={styles.thumbnailWrapper}>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="기사 썸네일"
                className={styles.thumbnail}
              />
            ) : (
              <div className={styles.thumbnailPlaceholder} />
            )}
          </div>

          <div className={styles.articleText}>
            <p className={styles.articleTitle}>{headline}</p>
            <p className={styles.articleMeta}>
              {publisher} · {publishedAt}
            </p>
          </div>
        </button>

        {/* 원문 이동 버튼 */}
        <div className={styles.primaryButtonWrapper}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleOpenArticle}
          >
            원문으로 이동하기
          </button>
        </div>

        {/* 하단 GNB */}
        <EduBottomBar onPrev={handlePrev} onNext={handleNext} />
      </div>
    </div>
  );
}

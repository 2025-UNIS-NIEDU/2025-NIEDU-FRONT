// src/pages/article/session/E/StepE001.tsx

import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import type { StepMeta } from "@/pages/article/ArticlePrepare";
import styles from "./StepE001.module.css";

type Props = {
  articleId?: string;
  articleUrl?: string;
  courseId?: string;
  sessionId?: string;
  stepMeta?: StepMeta;
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

export default function StepE001({
  articleId,
  articleUrl,
  courseId,
  sessionId: sessionIdFromProps,
  stepMeta,
}: Props) {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: LocationState };
  const { sessionId: sessionIdFromParams } = useParams<{ sessionId: string }>();

  const sessionId = sessionIdFromProps ?? sessionIdFromParams;

  const [hasOpened, setHasOpened] = useState(false);

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
    setHasOpened(true);
    window.open(sourceUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrev = () => nav(-1);

  const handleNext = async () => {
    if (!sessionId || !courseId || !stepMeta) {
      // 메타 정보 없으면 일단 다음 스텝으로만 이동
nav("/nie/session/E/step/002", {
  state: {
    articleId: articleId ?? state?.articleId,
    articleUrl: sourceUrl ?? articleUrl ?? state?.articleUrl,
    articleTitle: headline,
    articleSource: publisher,
    articlePublishedAt: publishedAt,
    articleImageUrl: thumbnailUrl,
  },
});
      return;
    }

    try {
      const userAnswer = {
        opened: hasOpened, // 다시 보기에서 실제로 눌렀는지
      };

      await submitStepAnswer({
        courseId,
        sessionId,
        stepId: stepMeta.stepId,
        contentType: stepMeta.contentType ?? "ARTICLE_READING", // ARTICLE_READING로 통일
        userAnswer,
      });
    } catch (e) {
      console.error("StepE001 답안 저장 오류:", e);
    }

nav("/nie/session/E/step/002", {
  state: {
    articleId: articleId ?? state?.articleId,
    articleUrl: sourceUrl ?? articleUrl ?? state?.articleUrl,
    articleTitle: headline,
    articleSource: publisher,
    articlePublishedAt: publishedAt,
    articleImageUrl: thumbnailUrl,
  },
});
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <h1 className={styles.heading}>기사 다시 보기</h1>
        <p className={styles.desc}>
          감정과 생각을 정리하기 전에,
          <br />
          기사를 한 번 더 훑어보면 좋아요.
        </p>

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

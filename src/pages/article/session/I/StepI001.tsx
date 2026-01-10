// src/pages/article/session/I/StepI001.tsx

import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepI001.module.css";

type StepMeta = {
  stepId: number;
  stepOrder: number;
  isCompleted: boolean;
  contentType: string;
  content: any;
  userAnswer: any;
};

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  startTime?: number;
  courseId?: number | string;
  sessionId?: number | string | null;
  level?: "N" | "E" | "I";
  steps?: StepMeta[];
};

type ArticleReadingContent = {
  thumbnailUrl: string;
  headline: string;
  publisher: string;
  publishedAt: string;
  sourceUrl: string;
};

export default function StepI001() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState | undefined) ?? {};

  const steps = state.steps ?? [];
  const STEP_ORDER = 1;
  const CONTENT_TYPE = "ARTICLE_READING";

  const currentStep = useMemo(() => {
    return (
      steps.find(
        (s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE
      ) ?? steps.find((s) => Number(s.stepOrder) === STEP_ORDER)
    );
  }, [steps]);

  const content = (currentStep?.content ?? {}) as Partial<ArticleReadingContent>;
  const thumbnailUrl = String(content.thumbnailUrl ?? "");
  const headline = String(content.headline ?? "선택한 기사 제목이 없습니다.");
  const publisher = String(content.publisher ?? "언론사");
  const publishedAt = String(content.publishedAt ?? "발행일");
  const sourceUrl = String(content.sourceUrl ?? state.articleUrl ?? "");

  const openArticle = () => {
    if (!sourceUrl) return;
    window.open(sourceUrl, "_blank", "noopener,noreferrer");
  };

  const goPrev = () => nav(-1);
  const goNext = () =>
    nav("/nie/session/I/step/002", { state: { ...state, articleUrl: sourceUrl }, replace: true });

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <h1 className={styles.heading}>기사 원문 읽기</h1>

        <button type="button" className={styles.articleCard} onClick={openArticle}>
          <div className={styles.thumbnailWrapper}>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="기사 썸네일" className={styles.thumbnail} />
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

        <div className={styles.primaryButtonWrapper}>
          <button type="button" className={styles.primaryButton} onClick={openArticle}>
            원문으로 이동하기
          </button>
        </div>

        <EduBottomBar onPrev={goPrev} onNext={goNext} />
      </div>
    </div>
  );
}

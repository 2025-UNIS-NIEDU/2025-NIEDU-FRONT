// src/pages/article/session/E/StepE001.tsx

import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepE001.module.css";
import { submitStepAnswer, quitSession } from "@/lib/apiClient";

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
  progress?: number;
  entryStepId?: number;
};

type ArticleReadingContent = {
  thumbnailUrl: string;
  headline: string;
  publisher: string;
  publishedAt: string;
  sourceUrl: string;
};

export default function StepE001() {
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

  const handleOpenArticle = () => {
    if (!sourceUrl) return;
    window.open(sourceUrl, "_blank", "noopener,noreferrer");
  };

  const goPrev = () => nav(-1);

  // ✅ ARTICLE_READING도 answer 저장 호출 → E 레벨 진행률 집계
  const goNext = async () => {
    const cid = Number(state.courseId ?? state.articleId);
    const sid = Number(state.sessionId);
    const stepId = Number(currentStep?.stepId);

    if (cid && sid && stepId) {
      try {
        await submitStepAnswer({
          courseId: cid,
          sessionId: sid,
          stepId,
          contentType: CONTENT_TYPE,
          userAnswer: { opened: true },
        });
      } catch (e) {
        console.error("[StepE001] submit answer error:", e);
      }
    }

    nav("/nie/session/E/step/2", {
      state: { ...state, level: "E", articleUrl: sourceUrl || state.articleUrl },
      replace: true,
    });
  };

  const handleQuit = async () => {
    const cid = Number(state.courseId ?? state.articleId);
    const sid = Number(state.sessionId);

    if (cid && sid) {
      try {
        await quitSession({ courseId: cid, sessionId: sid });
      } catch (e) {
        console.error("[StepE001] quit failed:", e);
      }
    }

    nav("/learn", { replace: true });
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <h1 className={styles.heading}>기사 원문 읽기</h1>

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

        <div className={styles.primaryButtonWrapper}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleOpenArticle}
          >
            원문으로 이동하기
          </button>
        </div>

        <EduBottomBar onPrev={goPrev} onNext={goNext} onQuit={handleQuit} />
      </div>
    </div>
  );
}

// src/pages/article/session/E/StepE004.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import {
  getSessionSummary,
  quitSession,
  submitForFeedback,
  submitStepAnswer,
} from "@/lib/apiClient";
import styles from "./StepE004.module.css";

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
  durationLabel?: string;
  courseId?: number | string;
  sessionId?: number | string | null;
  level?: "N" | "E" | "I";
  steps?: StepMeta[];
};

type SentenceItem = {
  contentId: number;
  prompt: string;
  reference?: string;
};

export default function StepE004() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState | undefined) ?? {};

  const steps = state.steps ?? [];
  const STEP_ORDER = 4;
  const CONTENT_TYPE = "SENTENCE_COMPLETION";

  const currentStep = useMemo(() => {
    return (
      steps.find(
        (s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE
      ) ?? steps.find((s) => Number(s.stepOrder) === STEP_ORDER)
    );
  }, [steps]);

  const [items, setItems] = useState<SentenceItem[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiFeedback, setAiFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const cid = Number(state.courseId ?? state.articleId);
  const sid = Number(state.sessionId);
  const stepId = Number(currentStep?.stepId);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);

    try {
      const contents = currentStep?.content?.contents;
      if (!Array.isArray(contents) || contents.length === 0) {
        setItems([]);
        setLoadError("문항 데이터를 불러오지 못했어요.");
      } else {
        const mapped: SentenceItem[] = contents.map((c: any) => ({
          contentId: Number(c?.contentId ?? 0),
          prompt: String(c?.prompt ?? c?.question ?? ""),
          reference: c?.reference ? String(c.reference) : undefined,
        }));
        setItems(mapped);
      }
    } catch (e) {
      console.error("[StepE004] parse failed:", e);
      setItems([]);
      setLoadError("문항 데이터를 불러오지 못했어요.");
    }

    setIndex(0);
    setAnswer("");
    setSubmitted(false);
    setAiScore(null);
    setAiFeedback("");
    setLoading(false);
  }, [currentStep]);

  const item = items[index];
  const total = items.length;

  const handlePrev = () => {
    nav("/nie/session/E/step/003", { state: { ...state }, replace: true });
  };

  const handleQuit = async () => {
    if (cid && sid) {
      try {
        await quitSession({ courseId: cid, sessionId: sid });
      } catch (e) {
        console.error("[StepE004] quit failed:", e);
      }
    }
    nav("/learn");
  };

  const handleSubmit = async () => {
    if (!cid || !sid || !stepId || !item) return;

    try {
      await submitStepAnswer({
        courseId: cid,
        sessionId: sid,
        stepId,
        contentType: CONTENT_TYPE,
        userAnswer: [{ contentId: item.contentId, userAnswer: answer }],
      });

      const fb = await submitForFeedback({
        courseId: cid,
        sessionId: sid,
        stepId,
        contentId: item.contentId,
        userAnswer: answer,
      });

      setAiScore(fb?.data?.AIScore ?? null);
      setAiFeedback(String(fb?.data?.AIFeedback ?? ""));
      setSubmitted(true);
    } catch (e) {
      console.error("[StepE004] submit/feedback error:", e);
      setSubmitted(true);
      setAiFeedback("피드백을 불러오지 못했어요. (서버/로그인 확인)");
    }
  };

  const handleNext = async () => {
    if (!submitted) {
      await handleSubmit();
      return;
    }

    if (index < total - 1) {
      setIndex((p) => p + 1);
      setAnswer("");
      setSubmitted(false);
      setAiScore(null);
      setAiFeedback("");
      return;
    }

    // ✅ 진짜 마지막: quitSession으로 집계 트리거 먼저 날리고 → summary → result
    try {
      if (cid && sid) await quitSession({ courseId: cid, sessionId: sid });
    } catch (e) {
      console.error("[StepE004] quit error:", e);
    }

    try {
      const summary = await getSessionSummary({ courseId: cid, sessionId: sid });
      const streak = summary?.data?.streak ?? 0;

      nav("/article/result", {
        state: {
          level: "E",
          streak,
          learningTime: summary?.data?.learningTime,
          durationLabel: state.durationLabel,
        },
        replace: true,
      });
    } catch (e) {
      console.error("[StepE004] summary error:", e);
      nav("/article/result", {
        state: { level: "E", streak: 0, durationLabel: state.durationLabel },
        replace: true,
      });
    }
  };

  if (loading) return <div className={styles.loading}>불러오는 중…</div>;
  if (loadError || !item)
    return <div className={styles.loading}>{loadError ?? "문항이 없습니다."}</div>;

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "100%" }} />
        </div>

        <h2 className={styles.heading}>문장 완성</h2>
        <p className={styles.desc}>문장을 자연스럽게 완성해보세요.</p>

        <div className={styles.promptCard}>
          <p className={styles.qNum}>
            {index + 1} / {total}
          </p>
          <p className={styles.promptText}>{item.prompt}</p>

          {item.reference && <p className={styles.referenceText}>힌트: {item.reference}</p>}

          <textarea
            className={styles.promptInput}
            placeholder="여기에 문장을 입력하세요"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitted}
          />

          {submitted && (
            <div className={styles.feedbackBox}>
              <p className={styles.feedbackTitle}>
                AI 피드백 {aiScore !== null ? `(점수: ${aiScore})` : ""}
              </p>
              <p className={styles.feedbackText}>{aiFeedback}</p>
            </div>
          )}
        </div>

        <EduBottomBar
          onPrev={handlePrev}
          onNext={handleNext}
          onQuit={handleQuit}
          disableNext={!submitted && answer.trim().length === 0}
        />
      </div>
    </div>
  );
}

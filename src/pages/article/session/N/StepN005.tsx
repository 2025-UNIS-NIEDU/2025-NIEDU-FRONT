// src/pages/article/session/N/StepN005.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer, getSessionSummary } from "@/lib/apiClient";
import styles from "./StepN005.module.css";

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

type QuizItem = {
  contentId: number;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  answerExplanation: string;
};

export default function StepN005() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState | undefined) ?? {};

  const steps = state.steps ?? [];
  const STEP_ORDER = 5;
  const CONTENT_TYPE = "MULTIPLE_CHOICE";

  const currentStep = useMemo(() => {
    return (
      steps.find((s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE) ??
      steps.find((s) => Number(s.stepOrder) === STEP_ORDER)
    );
  }, [steps]);

  const [items, setItems] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const startTime = state.startTime;

  const cid = Number(state.courseId ?? state.articleId);
  const sid = Number(state.sessionId);
  const stepId = Number(currentStep?.stepId);

  useEffect(() => {
    const contents = currentStep?.content?.contents;
    if (!Array.isArray(contents) || contents.length === 0) {
      setItems([]);
      return;
    }
    const mapped: QuizItem[] = contents.map((c: any) => ({
      contentId: Number(c?.contentId ?? 0),
      question: String(c?.question ?? ""),
      options: Array.isArray(c?.options)
        ? c.options.map((o: any) => ({ label: String(o?.label ?? ""), text: String(o?.text ?? "") }))
        : [],
      correctAnswer: String(c?.correctAnswer ?? ""),
      answerExplanation: String(c?.answerExplanation ?? ""),
    }));
    setItems(mapped);
    setIndex(0);
    setSelected(null);
    setConfirmed(false);
  }, [currentStep]);

  const q = items[index];
  const total = items.length;

  const handlePrev = () => nav(-1);

  const formatDuration = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min <= 0) return `${sec}초`;
    return `${min}분 ${sec}초`;
  };

  const saveAnswer = async () => {
    if (!cid || !sid || !stepId || !q || !selected) return;
    await submitStepAnswer({
      courseId: cid,
      sessionId: sid,
      stepId,
      contentType: CONTENT_TYPE,
      userAnswer: [{ contentId: q.contentId, value: selected }],
    });
  };

  const handleNext = async () => {
    if (!confirmed) {
      try {
        await saveAnswer();
      } catch (e) {
        console.error("[StepN005] submit error:", e);
      }
      setConfirmed(true);
      return;
    }

    if (index < total - 1) {
      setIndex((p) => p + 1);
      setSelected(null);
      setConfirmed(false);
      return;
    }

    // ✅ 마지막이면 summary로 streak 가져오기
    try {
      const summary = await getSessionSummary({ courseId: cid, sessionId: sid });
      const learningMs =
        Number(summary?.data?.learningTime ?? 0) ||
        (startTime ? Date.now() - startTime : 0);

      nav("/article/result", {
        state: {
          level: "N",
          streak: summary?.data?.streak ?? 0,
          durationLabel: formatDuration(learningMs),
        },
        replace: true,
      });
    } catch (e) {
      console.error("[StepN005] summary error:", e);
      const learningMs = startTime ? Date.now() - startTime : 0;
      nav(
        "/article/result",
        {
          state: { level: "N", streak: 0, durationLabel: formatDuration(learningMs) },
          replace: true,
        }
      );
    }
  };

  if (!q) return <div className={styles.loading}>문제가 없습니다.</div>;

  const totalSteps = Math.max(1, total);
  const progressPct = `${((index + 1) / totalSteps) * 100}%`;
  const isCorrectPick = confirmed && selected === q.correctAnswer;

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 상단 진행 바 (1/5 텍스트 대신) */}
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: progressPct }} />
        </div>

        <p className={styles.question}>{q.question}</p>

        <div className={styles.options}>
          {q.options.map((o) => {
            const isSel = selected === o.label;
            const isCorrect = confirmed && o.label === q.correctAnswer;
            const isWrong = confirmed && isSel && o.label !== q.correctAnswer;

            return (
              <button
                key={o.label}
                type="button"
                className={`${styles.option} ${
                  isCorrect
                    ? styles.optionCorrect
                    : isWrong
                      ? styles.optionWrong
                      : isSel
                        ? styles.optionSelected
                        : ""
                }`}
                onClick={() => !confirmed && setSelected(o.label)}
              >
                <span className={styles.optionLabel}>{o.label}</span>
                <span className={styles.optionText}>{o.text}</span>
              </button>
            );
          })}
        </div>

        {confirmed && (
          <div
            className={`${styles.answerBox} ${
              isCorrectPick ? styles.answerBoxCorrect : styles.answerBoxWrong
            }`}
          >
            <div className={styles.answerHeader}>
              <span className={styles.answerLabel}>정답: {q.correctAnswer}</span>
              {state.articleUrl ? (
                <button
                  type="button"
                  className={styles.sourceBtn}
                  onClick={() => window.open(state.articleUrl!, "_blank", "noopener,noreferrer")}
                >
                  뉴스 원문 보기
                </button>
              ) : null}
            </div>
            <p className={styles.answerText}>{q.answerExplanation}</p>
          </div>
        )}

        <EduBottomBar
          onPrev={handlePrev}
          onNext={handleNext}
          disableNext={!selected && !confirmed}
        />
      </div>
    </div>
  );
}

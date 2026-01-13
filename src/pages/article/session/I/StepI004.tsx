// src/pages/article/session/I/StepI004.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepI004.module.css";
import { submitStepAnswer, getSessionSummary, quitSession } from "@/lib/apiClient";

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

type ShortAnswerItem = {
  contentId: number;
  question: string;
  correctAnswer: string;
  answerExplanation: string;
  sourceUrl?: string;
};

function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}분 ${r}초`;
}

export default function StepI004() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState) || {};

  const startTime = state.startTime ?? Date.now();
  const courseId = Number(state.courseId ?? state.articleId);
  const sessionId = Number(state.sessionId);
  const steps = state.steps ?? [];

  const STEP_ORDER = 4;
  const CONTENT_TYPE = "SHORT_ANSWER";

  const currentStep = useMemo(() => {
    return steps.find((s) => Number(s.stepOrder) === STEP_ORDER);
  }, [steps]);

  const [items, setItems] = useState<ShortAnswerItem[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    const contents = currentStep?.content?.contents;
    if (!Array.isArray(contents)) {
      setItems([]);
      return;
    }

    const mapped: ShortAnswerItem[] = contents
      .map((c: any) => ({
        contentId: Number(c?.contentId ?? 0),
        question: String(c?.question ?? ""),
        correctAnswer: String(c?.correctAnswer ?? ""),
        answerExplanation: String(c?.answerExplanation ?? ""),
        sourceUrl: c?.sourceUrl ? String(c.sourceUrl) : undefined,
      }))
      .filter((x) => x.contentId && x.question);

    setItems(mapped);
    setIndex(0);
    setInput("");
    setConfirmed(false);
    setAnswers({});
  }, [currentStep]);

  const q = items[index];
  const total = items.length;

  const isCorrect =
    confirmed &&
    input.trim().length > 0 &&
    input.trim() === (q?.correctAnswer ?? "").trim();

  const submitAll = async (next: Record<number, string>) => {
    const stepId = Number(currentStep?.stepId);
    if (!courseId || !sessionId || !stepId || !q) return false;

    const payload = Object.entries(next).map(([contentId, value]) => ({
      contentId: Number(contentId),
      value,
    }));

    try {
      await submitStepAnswer({
        courseId,
        sessionId,
        stepId,
        contentType: CONTENT_TYPE,
        userAnswer: payload,
      });
      return true;
    } catch (e) {
      console.error("[StepI004] submit error:", e);
      return false;
    }
  };

  const checkAnswer = async () => {
    if (!q || !input.trim()) return;
    const next = { ...answers, [q.contentId]: input };
    setAnswers(next);

    const ok = await submitAll(next);
    if (!ok) return;
    setConfirmed(true);
  };

  const nextProblem = async () => {
    if (index < total - 1) {
      setIndex((p) => p + 1);
      setInput("");
      setConfirmed(false);
      return;
    }

    // ✅ 마지막: quit → summary → result (durationLabel 포함)
    try {
      if (courseId && sessionId) await quitSession({ courseId, sessionId });
    } catch (e) {
      console.error("[StepI004] quit error:", e);
    }

    let streak = 0;
    try {
      const summary = await getSessionSummary({ courseId, sessionId });
      streak = summary?.data?.streak ?? 0;
    } catch (e) {
      console.error("[StepI004] summary error:", e);
    }

    const durationLabel = formatDuration(Date.now() - startTime);
    nav("/article/result", { state: { streak, durationLabel }, replace: true });
  };

  const handlePrev = () =>
    nav("/nie/session/I/step/003", { state: { ...state, startTime }, replace: true });

  const handleQuit = async () => {
    try {
      if (courseId && sessionId) await quitSession({ courseId, sessionId });
    } catch (e) {
      console.error("[StepI004] quit error:", e);
    }
    nav("/learn");
  };

  if (!q) return <div className={styles.viewport}><div className={styles.container}>문제가 없습니다.</div></div>;

  const sourceLink = q.sourceUrl || state.articleUrl || "";

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>

        <p className={styles.question}>{q.question}</p>

        <input
          className={`${styles.input} ${confirmed ? styles.inputDisabled : ""}`}
          placeholder="답안을 작성하세요."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={confirmed}
        />

        {!confirmed && (
          <button className={styles.checkBtn} disabled={!input.trim()} onClick={() => void checkAnswer()}>
            정답 확인하기
          </button>
        )}

        {confirmed && (
          <div className={`${styles.answerBox} ${isCorrect ? styles.answerBoxCorrect : styles.answerBoxWrong}`}>
            <div className={styles.answerHeader}>
              <span className={styles.answerLabel}>{isCorrect ? "정답" : "동반자"}</span>
              {sourceLink && (
                <button type="button" className={styles.sourceBtn} onClick={() => window.open(sourceLink, "_blank")}>
                  뉴스 원문 보기
                </button>
              )}
            </div>
            <div className={styles.answerText}>
              <b>정답:</b> {q.correctAnswer}
              <div style={{ height: 10 }} />
              {q.answerExplanation}
            </div>
          </div>
        )}

        <div className={styles.bottomSpace} />

        <EduBottomBar
          onPrev={handlePrev}
          onQuit={handleQuit}
          onNext={confirmed ? () => void nextProblem() : undefined}
          disableNext={!confirmed}
        />
      </div>
    </div>
  );
}

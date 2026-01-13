// src/pages/article/session/E/StepE003.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepE003.module.css";
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
};

type ShortAnswerItem = {
  contentId: number;
  question: string;
  correctAnswer: string;
  answerExplanation: string;
  sourceUrl?: string;
};

export default function StepE003() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState) || {};

  const startTime = state.startTime ?? Date.now();
  const courseId = Number(state.courseId ?? state.articleId);
  const sessionId = Number(state.sessionId);
  const steps = state.steps ?? [];

  const STEP_ORDER = 3;
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
      console.error("[StepE003] submit error:", e);
      return false;
    }
  };

  const checkAnswer = async () => {
    if (!q) return;
    const next = { ...answers, [q.contentId]: input };
    setAnswers(next);
    const ok = await submitAll(next);
    if (!ok) return;
    setConfirmed(true);
  };

  const nextProblem = () => {
    if (index >= total - 1) {
      nav("/nie/session/E/step/4", { state: { ...state, startTime }, replace: true });
      return;
    }
    setIndex((i) => i + 1);
    setInput("");
    setConfirmed(false);
  };

  const handlePrev = () =>
    nav("/nie/session/E/step/2", { state: { ...state, startTime }, replace: true });

  const handleNext = async () => {
    if (!confirmed) {
      await checkAnswer();
      return;
    }
    nextProblem();
  };

  const handleQuit = async () => {
    try {
      if (courseId && sessionId) await quitSession({ courseId, sessionId });
    } catch (e) {
      console.error("[StepE003] quit error:", e);
    }
    nav("/learn", { replace: true });
  };

  if (!q)
    return (
      <div className={styles.viewport}>
        <div className={styles.container}>문제가 없습니다.</div>
      </div>
    );

  const sourceLink = q.sourceUrl || state.articleUrl || "";

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.progressWrap}>
          <div
            className={styles.progress}
            style={{ width: `${Math.max(0, Math.min(100, ((index + 1) / total) * 100))}%` }}
          />
        </div>

        <p className={styles.question}>{q.question}</p>

        <input
          className={`${styles.input} ${confirmed ? styles.inputDisabled : ""}`}
          placeholder="답안을 작성하세요."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={confirmed}
        />

        <button
          type="button"
          className={styles.checkBtn}
          onClick={confirmed ? nextProblem : checkAnswer}
          disabled={!confirmed && input.trim().length === 0}
        >
          {confirmed ? "다음" : "답안 제출하기"}
        </button>

        {confirmed && (
          <div
            className={`${styles.answerBox} ${
              isCorrect ? styles.answerBoxCorrect : styles.answerBoxWrong
            }`}
          >
            <div className={styles.answerHeader}>
              <span className={styles.answerLabel}>
                {isCorrect ? "정답이에요!" : "정답을 확인해볼까요?"}
              </span>
              {sourceLink && (
                <a
                  className={styles.sourceBtn}
                  href={sourceLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  기사 보러가기
                </a>
              )}
            </div>

            <p className={styles.answerText}>정답: {q.correctAnswer}</p>
            <p className={styles.answerText}>{q.answerExplanation}</p>
          </div>
        )}

        <div className={styles.bottomSpace} />
      </div>

      <EduBottomBar
        onPrev={handlePrev}
        onNext={handleNext}
        onQuit={handleQuit}
        disableNext={!confirmed && input.trim().length === 0}
      />
    </div>
  );
}

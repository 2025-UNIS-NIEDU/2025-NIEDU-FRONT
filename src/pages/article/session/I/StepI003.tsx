// src/pages/article/session/I/StepI003.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepI003.module.css";
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

type QuizItem = {
  contentId: number;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string; // A~D
  answerExplanation: string;
  sourceUrl?: string;
};

export default function StepI003() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState) || {};

  const startTime = state.startTime ?? Date.now();
  const courseId = Number(state.courseId ?? state.articleId);
  const sessionId = Number(state.sessionId);
  const steps = state.steps ?? [];

  const STEP_ORDER = 3;
  const CONTENT_TYPE = "MULTIPLE_CHOICE";

  const currentStep = useMemo(() => {
    return steps.find((s) => Number(s.stepOrder) === STEP_ORDER);
  }, [steps]);

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    const contents = currentStep?.content?.contents;
    if (!Array.isArray(contents)) {
      setQuizzes([]);
      return;
    }

    const mapped: QuizItem[] = contents
      .map((c: any) => ({
        contentId: Number(c?.contentId ?? c?.id ?? 0),
        question: String(c?.question ?? ""),
        options: Array.isArray(c?.options)
          ? c.options.map((o: any, idx: number) => ({
              label: String(o?.label ?? String.fromCharCode(65 + idx)),
              text: String(o?.text ?? ""),
            }))
          : [],
        correctAnswer: String(c?.correctAnswer ?? ""),
        answerExplanation: String(c?.answerExplanation ?? ""),
        sourceUrl: c?.sourceUrl ? String(c.sourceUrl) : undefined,
      }))
      .filter((x) => x.contentId && x.question);

    setQuizzes(mapped);
    setIndex(0);
    setChoice(null);
    setConfirmed(false);
    setAnswers({});
  }, [currentStep]);

  const q = quizzes[index];
  const total = quizzes.length;

  const isCorrect = !!q && !!choice && choice === q.correctAnswer;

  const submitAll = async (next: Record<number, string>) => {
    const stepId = Number(currentStep?.stepId);
    if (!courseId || !sessionId || !stepId || !q || !choice) return false;

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
        userAnswer: payload, // apiClient가 answers로 래핑해줌
      });
      return true;
    } catch (e) {
      console.error("[StepI003] submit error:", e);
      return false;
    }
  };

  const checkAnswer = async () => {
    if (!q || !choice) return;
    const next = { ...answers, [q.contentId]: choice };
    setAnswers(next);
    const ok = await submitAll(next);
    if (!ok) return;
    setConfirmed(true);
  };

  const nextProblem = () => {
    if (index >= total - 1) {
      nav("/nie/session/I/step/004", { state: { ...state, startTime }, replace: true });
      return;
    }
    setIndex((i) => i + 1);
    setChoice(null);
    setConfirmed(false);
  };

  const handlePrev = () =>
    nav("/nie/session/I/step/002", { state: { ...state, startTime }, replace: true });

  const handleQuit = async () => {
    try {
      if (courseId && sessionId) await quitSession({ courseId, sessionId });
    } catch (e) {
      console.error("[StepI003] quit error:", e);
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

        <div className={styles.options}>
          {q.options.map((o) => {
            const isSel = choice === o.label;

            const cls =
              !confirmed
                ? isSel
                  ? styles.optionSelected
                  : ""
                : o.label === q.correctAnswer
                ? styles.optionCorrect
                : isSel
                ? styles.optionWrong
                : "";

            return (
              <button
                key={o.label}
                type="button"
                className={`${styles.option} ${cls}`}
                onClick={() => !confirmed && setChoice(o.label)}
              >
                <span className={styles.optionLabel}>{o.label}</span>
                <span className={styles.optionText}>{o.text}</span>
              </button>
            );
          })}
        </div>

        {!confirmed && (
          <button className={styles.checkBtn} disabled={!choice} onClick={() => void checkAnswer()}>
            정답 확인하기
          </button>
        )}

        {confirmed && (
          <div
            className={`${styles.answerBox} ${
              isCorrect ? styles.answerBoxCorrect : styles.answerBoxWrong
            }`}
          >
            <div className={styles.answerHeader}>
              <span className={styles.answerLabel}>정답: {q.correctAnswer}</span>
              {sourceLink && (
                <button
                  type="button"
                  className={styles.sourceBtn}
                  onClick={() => window.open(sourceLink, "_blank")}
                >
                  뉴스 원문 보기
                </button>
              )}
            </div>
            <p className={styles.answerText}>{q.answerExplanation}</p>
          </div>
        )}

        <div className={styles.bottomSpace} />

        <EduBottomBar
          onPrev={handlePrev}
          onNext={confirmed ? nextProblem : undefined}
          onQuit={handleQuit}
          disableNext={!confirmed}
        />
      </div>
    </div>
  );
}

// src/pages/article/session/I/StepI003.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import styles from "./StepI003.module.css";

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

type MCQ = {
  contentId: number;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string; // "A"~"D"
  answerExplanation: string;
};

export default function StepI003() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState | undefined) ?? {};

  const steps = state.steps ?? [];
  const STEP_ORDER = 3;
  const CONTENT_TYPE = "MULTIPLE_CHOICE";

  const currentStep = useMemo(() => {
    return (
      steps.find((s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE) ??
      steps.find((s) => Number(s.stepOrder) === STEP_ORDER)
    );
  }, [steps]);

  const [items, setItems] = useState<MCQ[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const contents = currentStep?.content?.contents;
    if (!Array.isArray(contents) || contents.length === 0) {
      setItems([]);
      return;
    }

    const mapped: MCQ[] = contents.map((c: any) => ({
      contentId: Number(c?.contentId ?? 0),
      question: String(c?.question ?? ""),
      options: Array.isArray(c?.options)
        ? c.options.map((o: any) => ({
            label: String(o?.label ?? ""),
            text: String(o?.text ?? ""),
          }))
        : [],
      correctAnswer: String(c?.correctAnswer ?? ""),
      answerExplanation: String(c?.answerExplanation ?? ""),
    }));

    setItems(mapped);
    setIndex(0);
    setSelected(null);
    setConfirmed(false);

    const prev = currentStep?.userAnswer;
    // 형태가 다양할 수 있어서 최대한 복원
    if (Array.isArray(prev) && prev[0]?.value) setSelected(String(prev[0].value));
  }, [currentStep]);

  const q = items[index];
  const total = items.length;

  const cid = Number(state.courseId ?? state.articleId);
  const sid = Number(state.sessionId);
  const stepId = Number(currentStep?.stepId);

  const handlePrev = () => nav("/nie/session/I/step/002", { state: { ...state }, replace: true });

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
        console.error("[StepI003] submit answer error:", e);
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

    nav("/nie/session/I/step/004", { state: { ...state }, replace: true });
  };

  if (!q) return <div className={styles.loading}>문제가 없습니다.</div>;

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <h2 className={styles.heading}>객관식 퀴즈</h2>

        <div className={styles.card}>
          <p className={styles.qNum}>
            {index + 1} / {total}
          </p>
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
                    isCorrect ? styles.correct : isWrong ? styles.wrong : isSel ? styles.active : ""
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
            <div className={styles.explainBox}>
              <p className={styles.answerLine}>정답: {q.correctAnswer}</p>
              <p className={styles.explainText}>{q.answerExplanation}</p>
            </div>
          )}
        </div>

        <EduBottomBar onPrev={handlePrev} onNext={handleNext} disableNext={!selected && !confirmed} />
      </div>
    </div>
  );
}

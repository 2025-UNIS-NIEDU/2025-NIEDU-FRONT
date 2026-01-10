// src/pages/article/session/I/StepI004.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer, getSessionSummary } from "@/lib/apiClient";
import styles from "./StepI004.module.css";

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
};

export default function StepI004() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState | undefined) ?? {};

  const steps = state.steps ?? [];
  const STEP_ORDER = 4;
  const CONTENT_TYPE = "SHORT_ANSWER";

  const currentStep = useMemo(() => {
    return (
      steps.find((s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE) ??
      steps.find((s) => Number(s.stepOrder) === STEP_ORDER)
    );
  }, [steps]);

  const [items, setItems] = useState<ShortAnswerItem[]>([]);
  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const cid = Number(state.courseId ?? state.articleId);
  const sid = Number(state.sessionId);
  const stepId = Number(currentStep?.stepId);

  useEffect(() => {
    const contents = currentStep?.content?.contents;
    if (!Array.isArray(contents) || contents.length === 0) {
      setItems([]);
      return;
    }
    const mapped = contents.map((c: any) => ({
      contentId: Number(c?.contentId ?? 0),
      question: String(c?.question ?? ""),
      correctAnswer: String(c?.correctAnswer ?? ""),
      answerExplanation: String(c?.answerExplanation ?? ""),
    }));
    setItems(mapped);
    setIndex(0);
    setUserAnswer("");
    setConfirmed(false);
  }, [currentStep]);

  const q = items[index];
  const total = items.length;

  const handlePrev = () => nav("/nie/session/I/step/003", { state: { ...state }, replace: true });

  const saveAnswer = async () => {
    if (!cid || !sid || !stepId || !q) return;
    await submitStepAnswer({
      courseId: cid,
      sessionId: sid,
      stepId,
      contentType: CONTENT_TYPE,
      userAnswer: [{ contentId: q.contentId, value: userAnswer }],
    });
  };

  const handleNext = async () => {
    if (!confirmed) {
      try {
        await saveAnswer();
      } catch (e) {
        console.error("[StepI004] submit error:", e);
      }
      setConfirmed(true);
      return;
    }

    if (index < total - 1) {
      setIndex((p) => p + 1);
      setUserAnswer("");
      setConfirmed(false);
      return;
    }

    // ✅ 끝나면 summary로 streak 가져와서 result
    try {
      const summary = await getSessionSummary({ courseId: cid, sessionId: sid });
      nav("/article/result", {
        state: {
          level: "I",
          streak: summary?.data?.streak ?? 0,
          learningTime: summary?.data?.learningTime,
        },
        replace: true,
      });
    } catch (e) {
      console.error("[StepI004] summary error:", e);
      nav("/article/result", { state: { level: "I", streak: 0 }, replace: true });
    }
  };

  if (!q) return <div className={styles.loading}>문제가 없습니다.</div>;

  const isCorrect =
    confirmed && userAnswer.trim().length > 0 && userAnswer.trim() === q.correctAnswer.trim();

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <h2 className={styles.heading}>주관식</h2>

        <div className={styles.card}>
          <p className={styles.qNum}>
            {index + 1} / {total}
          </p>
          <p className={styles.question}>{q.question}</p>

          <textarea
            className={styles.textarea}
            placeholder="정답을 입력해주세요"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={confirmed}
          />

          {confirmed && (
            <div className={styles.explainBox}>
              <p className={styles.explainTitle}>
                {isCorrect ? "정답이에요!" : "정답을 확인해볼까요?"}
              </p>
              <p className={styles.answerLine}>정답: {q.correctAnswer}</p>
              <p className={styles.explainText}>{q.answerExplanation}</p>
            </div>
          )}
        </div>

        <EduBottomBar
          onPrev={handlePrev}
          onNext={handleNext}
          disableNext={!confirmed && userAnswer.trim().length === 0}
        />
      </div>
    </div>
  );
}

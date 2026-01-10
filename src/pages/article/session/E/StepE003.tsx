// src/pages/article/session/E/StepE003.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import styles from "./StepE003.module.css";

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
  const state = (location.state as RouteState | undefined) ?? {};

  const steps = state.steps ?? [];
  const STEP_ORDER = 3;
  const CONTENT_TYPE = "SHORT_ANSWER";

  const currentStep = useMemo(() => {
    return (
      steps.find(
        (s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE
      ) ?? steps.find((s) => Number(s.stepOrder) === STEP_ORDER)
    );
  }, [steps]);

  const [items, setItems] = useState<ShortAnswerItem[]>([]);
  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    try {
      const contents = currentStep?.content?.contents;
      if (!Array.isArray(contents) || contents.length === 0) {
        setItems([]);
        setLoadError("문제를 불러오지 못했어요.");
      } else {
        const sourceUrl = String(currentStep?.content?.sourceUrl ?? "");
        const mapped: ShortAnswerItem[] = contents.map((c: any) => ({
          contentId: Number(c?.contentId ?? 0),
          question: String(c?.question ?? ""),
          correctAnswer: String(c?.correctAnswer ?? ""),
          answerExplanation: String(c?.answerExplanation ?? ""),
          sourceUrl,
        }));
        setItems(mapped);
      }
    } catch (e) {
      console.error("[StepE003] parse content failed:", e);
      setItems([]);
      setLoadError("문제를 불러오지 못했어요.");
    }
    setIndex(0);
    setUserAnswer("");
    setConfirmed(false);
    setLoading(false);
  }, [currentStep]);

  const q = items[index];
  const total = items.length;

  const cid = Number(state.courseId ?? state.articleId);
  const sid = Number(state.sessionId);
  const stepId = Number(currentStep?.stepId);
  const startTime = state.startTime ?? Date.now();

  const sendAnswer = async () => {
    if (!cid || !sid || !stepId || !q) return;
    const payload = [{ contentId: q.contentId, value: userAnswer }];
    await submitStepAnswer({
      courseId: cid,
      sessionId: sid,
      stepId,
      contentType: CONTENT_TYPE,
      userAnswer: payload,
    });
  };

  const handleConfirm = async () => {
    try {
      await sendAnswer();
      setConfirmed(true);
    } catch (e) {
      console.error("[StepE003] submit answer error:", e);
    }
  };

  const handleNext = async () => {
    if (!confirmed) {
      await handleConfirm();
      return;
    }

    if (index < total - 1) {
      setIndex((prev) => prev + 1);
      setUserAnswer("");
      setConfirmed(false);
      return;
    }

    const diffSec = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(diffSec / 60);
    const seconds = diffSec % 60;
    const durationLabel = `${minutes}분 ${seconds}초`;

    nav("/nie/session/E/step/004", {
      state: { ...state, durationLabel },
      replace: true,
    });
  };

  const handlePrev = () => {
    nav("/nie/session/E/step/002", { state: { ...state }, replace: true });
  };

  if (loading) return <div className={styles.loading}>불러오는 중…</div>;
  if (loadError || !q)
    return <div className={styles.loading}>{loadError ?? "문제가 없습니다."}</div>;

  const isCorrect =
    confirmed &&
    userAnswer.trim().length > 0 &&
    userAnswer.trim() === q.correctAnswer.trim();

  const sourceLink = q.sourceUrl || state.articleUrl || "";

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "85%" }} />
        </div>

        <h2 className={styles.heading}>주관식 문제</h2>

        {sourceLink && (
          <a className={styles.sourceLink} href={sourceLink} target="_blank" rel="noreferrer">
            기사 보러가기
          </a>
        )}

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
          nextDisabled={!confirmed && userAnswer.trim().length === 0}
          nextLabel={confirmed ? "다음" : "정답 확인"}
        />
      </div>
    </div>
  );
}

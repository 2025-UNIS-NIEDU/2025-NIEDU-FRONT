// src/pages/article/session/E/StepE004.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import {
  submitForFeedback,
  submitStepAnswer,
  getSessionSummary,
  quitSession,
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
};

type FeedbackSections = {
  meaning?: string;
  context?: string;
  grammar?: string;
  raw?: string;
};

function parseFeedback(input: unknown): FeedbackSections {
  if (input && typeof input === "object") {
    const o = input as any;
    const meaning = o.meaning ?? o.MEANING ?? o.의미;
    const context = o.context ?? o.CONTEXT ?? o.맥락;
    const grammar = o.grammar ?? o.GRAMMAR ?? o.문법;
    const raw = typeof o === "string" ? o : undefined;
    return {
      meaning: typeof meaning === "string" ? meaning : undefined,
      context: typeof context === "string" ? context : undefined,
      grammar: typeof grammar === "string" ? grammar : undefined,
      raw,
    };
  }

  const s = String(input ?? "").trim();
  if (!s) return { raw: "" };

  const pick = (label: string) => {
    const idx = s.indexOf(label);
    if (idx === -1) return null;
    const start = idx + label.length;
    const nextLabels = ["의미", "맥락", "문법"].filter((l) => l !== label);
    let end = s.length;
    for (const nl of nextLabels) {
      const j = s.indexOf(nl, start);
      if (j !== -1) end = Math.min(end, j);
    }
    return s.slice(start, end).replace(/^[\s:：\-]+/, "").trim();
  };

  const meaning = pick("의미") ?? undefined;
  const context = pick("맥락") ?? undefined;
  const grammar = pick("문법") ?? undefined;

  return { meaning, context, grammar, raw: s };
}

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
  const [aiFeedback, setAiFeedback] = useState<FeedbackSections>({});
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
          prompt: String(c?.question ?? c?.prompt ?? c?.sentence ?? ""),
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
    setAiFeedback({});
    setLoading(false);
  }, [currentStep]);

  const item = items[index];
  const total = items.length;

  const handlePrev = () => {
    nav("/nie/session/E/step/3", { state: { ...state }, replace: true });
  };

  const handleQuit = async () => {
    if (cid && sid) {
      try {
        await quitSession({ courseId: cid, sessionId: sid });
      } catch (e) {
        console.error("[StepE004] quit failed:", e);
      }
    }
    nav("/learn", { replace: true });
  };

  const handleSubmit = async () => {
    if (!cid || !sid || !stepId || !item) return;

    try {
      // 1) answer 저장(진행률/세션 기록)
      await submitStepAnswer({
        courseId: cid,
        sessionId: sid,
        stepId,
        contentType: CONTENT_TYPE,
        userAnswer: [{ contentId: item.contentId, userAnswer: answer }],
      });

      // 2) AI 피드백
      const fb = await submitForFeedback({
        courseId: cid,
        sessionId: sid,
        stepId,
        contentId: item.contentId,
        userAnswer: answer,
      });

      const score = fb?.data?.AIScore;
      const text = fb?.data?.AIFeedback;

      setAiScore(typeof score === "number" ? score : null);
      setAiFeedback(parseFeedback(text));
      setSubmitted(true);
    } catch (e) {
      console.error("[StepE004] submit/feedback error:", e);
      setAiScore(null);
      setAiFeedback({ raw: "피드백을 불러오지 못했어요. (서버/로그인 확인)" });
      setSubmitted(true);
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
      setAiFeedback({});
      return;
    }

    // 마지막이면 summary 조회 후 result
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

  const scoreNum = typeof aiScore === "number" ? aiScore : null;

  // ✅ 40점 이하/이상 토끼 이미지 분기
  const rabbitSrc =
    scoreNum !== null && scoreNum <= 40 ? "/icons/Frame 4.svg" : "/icons/Frame 3.svg";

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "100%" }} />
        </div>

        {!submitted ? (
          <>
            <p className={styles.prompt}>{item.prompt}</p>

            <textarea
              className={styles.textarea}
              placeholder="답안을 작성하세요."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />

            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={answer.trim().length === 0}
            >
              답안 제출하기
            </button>
          </>
        ) : (
          <>
            <div className={styles.scoreRow}>
              <img className={styles.rabbit} src={rabbitSrc} alt="" />
              <div className={styles.scoreText}>
                <p className={styles.score}>
                  {scoreNum !== null ? `${scoreNum}점` : "점수"}
                </p>
                <p className={styles.scoreSub}>좀더 생각해봐요.</p>
              </div>
            </div>

            <p className={styles.aiTitle}>AI 피드백</p>

            <div className={styles.feedbackCard}>
              {aiFeedback.meaning && (
                <div className={styles.section}>
                  <p className={styles.sectionTitle}>의미</p>
                  <p className={styles.sectionText}>{aiFeedback.meaning}</p>
                </div>
              )}

              {aiFeedback.context && (
                <div className={styles.section}>
                  <p className={styles.sectionTitle}>맥락</p>
                  <p className={styles.sectionText}>{aiFeedback.context}</p>
                </div>
              )}

              {aiFeedback.grammar && (
                <div className={styles.section}>
                  <p className={styles.sectionTitle}>문법</p>
                  <p className={styles.sectionText}>{aiFeedback.grammar}</p>
                </div>
              )}

              {!aiFeedback.meaning && !aiFeedback.context && !aiFeedback.grammar && (
                <p className={styles.sectionText}>{aiFeedback.raw ?? ""}</p>
              )}
            </div>
          </>
        )}

        <div className={styles.bottomSpace} />
      </div>

      <EduBottomBar
        onPrev={handlePrev}
        onNext={handleNext}
        onQuit={handleQuit}
        disableNext={!submitted && answer.trim().length === 0}
      />
    </div>
  );
}

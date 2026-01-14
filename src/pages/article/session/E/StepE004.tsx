// src/pages/article/session/E/StepE004.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitForFeedback, getSessionSummary, quitSession } from "@/lib/apiClient";
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
  startTime?: number; // ✅ 시작시간 받아서 결과 시간 fallback 계산
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

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}분 ${s}초`;
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
  const [aiFeedback, setAiFeedback] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const cid = Number(state.courseId ?? state.articleId);
  const sid = Number(state.sessionId);
  const stepId = Number(currentStep?.stepId);

  const startTime = state.startTime ?? Date.now(); // ✅ 없으면 현재로라도

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
    nav("/nie/session/E/step/003", { state: { ...state, startTime }, replace: true });
  };

  // ✅ 종료 버튼 (E단계도 안 눌리던 문제 같이 해결)
  const handleQuit = async () => {
    try {
      if (cid && sid) await quitSession({ courseId: cid, sessionId: sid });
    } catch (e) {
      console.error("[StepE004] quit failed:", e);
    }
    nav("/learn", { replace: true });
  };

  // ✅ API 문서 기준: submit-for-feedback 한 번으로 "답안 제출 + 점수/피드백 반환"
  const handleSubmit = async () => {
    if (!cid || !sid || !stepId || !item) return;

    try {
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
      console.error("[StepE004] submit-for-feedback error:", e);
      setSubmitted(true);
      setAiScore(null);
      setAiFeedback("피드백을 불러오지 못했어요. (서버/로그인 확인)");
    }
  };

  const handleNext = async () => {
    if (!submitted) {
      await handleSubmit();
      return;
    }

    // 다음 문항
    if (index < total - 1) {
      setIndex((p) => p + 1);
      setAnswer("");
      setSubmitted(false);
      setAiScore(null);
      setAiFeedback("");
      return;
    }

    // ✅ 마지막: (1) quit로 집계 트리거 → (2) summary → (3) durationLabel 계산해서 result로
    try {
      try {
        await quitSession({ courseId: cid, sessionId: sid });
      } catch (e) {
        console.error("[StepE004] quit on finish failed:", e);
      }

      const summary = await getSessionSummary({ courseId: cid, sessionId: sid });

      // summary.learningTime이 ms든 sec든 불명확해서 안전하게 처리:
      // - 숫자가 크면 ms로 간주, 작으면 sec로 간주 (보수적으로)
      const raw = Number(summary?.data?.learningTime ?? 0);
      const ms =
        raw >= 1000 * 60 * 5
          ? raw // 5분 이상이면 ms일 가능성 높음
          : raw > 0
          ? raw * 1000 // 짧은 수치면 sec일 가능성
          : Date.now() - startTime; // 서버가 안주면 fallback

      nav("/article/result", {
        state: {
          level: "E",
          streak: summary?.data?.streak ?? 0,
          durationLabel: formatDuration(ms),
        },
        replace: true,
      });
    } catch (e) {
      console.error("[StepE004] summary error:", e);
      const ms = Date.now() - startTime;
      nav("/article/result", {
        state: { level: "E", streak: 0, durationLabel: formatDuration(ms) },
        replace: true,
      });
    }
  };

  if (loading) return <div className={styles.loading}>불러오는 중…</div>;
  if (loadError || !item)
    return <div className={styles.loading}>{loadError ?? "문항이 없습니다."}</div>;

  // ✅ 40점 이하/이상 토끼 분기 (요청사항 유지)
  const rabbitSrc =
    aiScore !== null && aiScore <= 40 ? "/icons/sadbunny.svg" : "/icons/happybunny.svg";

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
                <p className={styles.score}>{aiScore !== null ? `${aiScore}점` : "점수"}</p>
                <p className={styles.scoreSub}>좀더 생각해봐요.</p>
              </div>
            </div>

            <p className={styles.aiTitle}>AI 피드백</p>

            <div className={styles.feedbackCard}>
              <p className={styles.sectionText} style={{ whiteSpace: "pre-wrap" }}>
                {aiFeedback}
              </p>
            </div>
          </>
        )}

        <div className={styles.bottomSpace} />
      </div>

      <EduBottomBar
        onPrev={handlePrev}
        onNext={handleNext}
        onQuit={handleQuit}              // ✅ E단계 종료 버튼 연결
        disableNext={!submitted && answer.trim().length === 0}
      />
    </div>
  );
}

// src/pages/article/session/E/StepE003.tsx

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import type { StepMeta } from "@/pages/article/ArticlePrepare";
import styles from "./StepE003.module.css";

import economyPackage from "@/data/economy_2025-11-24_package.json";

type Props = {
  articleId?: string;
  articleUrl?: string;
  courseId?: string;
  sessionId?: string;
  stepMeta?: StepMeta;
};

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  courseId?: string;
  sessionId?: string;
  level?: "N" | "E" | "I";
};

type ShortAnswerItemFromApi = {
  contentId: number;
  question: string;
  correctAnswer: string;
  answerExplanation: string;
  sourceUrl: string;
};

type QuizItem = ShortAnswerItemFromApi;

// 🔍 레벨 E, SHORT_ANSWER(stepOrder=3) 찾기
function findEShortAnswer(
  pkg: any,
  courseId?: string | number,
  sessionId?: string | number
): ShortAnswerItemFromApi[] | undefined {
  const courses = pkg.courses ?? [];
  if (!courses.length) return undefined;

  const course =
    courses.find(
      (c: any) => String(c.courseId) === String(courseId ?? courses[0].courseId)
    ) ?? courses[0];

  const sessions = course?.sessions ?? [];
  if (!sessions.length) return undefined;

  const session =
    sessions.find(
      (s: any) =>
        String(s.sessionId) === String(sessionId ?? sessions[0].sessionId)
    ) ?? sessions[0];

  const quizE = session?.quizzes?.find((q: any) => q.level === "E");
  const step3 = quizE?.steps?.find(
    (s: any) => s.stepOrder === 3 && s.contentType === "SHORT_ANSWER"
  );

  if (Array.isArray(step3?.contents) && step3.contents.length > 0) {
    return step3.contents as ShortAnswerItemFromApi[];
  }

  return undefined;
}

export default function StepE003({
  articleId,
  articleUrl,
  courseId,
  sessionId,
  stepMeta,
}: Props) {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState) || {};

  const aId = state.articleId ?? articleId;
  const aUrl = state.articleUrl ?? articleUrl;
  const effectiveCourseId = state.courseId ?? courseId;
  const effectiveSessionId = state.sessionId ?? sessionId;

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 이 단계에서 걸린 시간 (E004로 넘길 때 사용)
  const [startTime] = useState(() => Date.now());

  // ✅ stepMeta.content 우선, 없으면 JSON(E-SHORT_ANSWER) 사용
  useEffect(() => {
    setLoading(true);
    setLoadError(null);

    try {
      let parsed: QuizItem[] | undefined;

      const raw = stepMeta?.content as any;
      if (raw) {
        let obj = raw;
        if (typeof raw === "string") {
          try {
            obj = JSON.parse(raw);
          } catch (e) {
            console.warn("[StepE003] stepMeta.content JSON 파싱 실패", e, raw);
          }
        }

        // 1) 바로 contents 배열
        if (Array.isArray(obj?.contents)) {
          parsed = obj.contents as QuizItem[];
        }
        // 2) 그냥 배열로 내려올 수도 있음
        else if (Array.isArray(obj)) {
          parsed = obj as QuizItem[];
        }
      }

      if (!parsed) {
        parsed = findEShortAnswer(
          economyPackage as any,
          effectiveCourseId,
          effectiveSessionId
        );
      }

      if (!parsed || parsed.length === 0) {
        console.warn("[StepE003] SHORT_ANSWER 데이터 없음/포맷 불일치", {
          stepMeta,
          effectiveCourseId,
          effectiveSessionId,
        });
        setLoadError("단답형 문제 데이터를 불러오지 못했어요.");
        setLoading(false);
        return;
      }

      setQuizzes(parsed);
      setIndex(0);
      setUserAnswer("");
      setConfirmed(false);
      setIsCorrect(null);
      setLoading(false);
    } catch (e) {
      console.error("[StepE003] 데이터 로드 오류:", e);
      setLoadError("단답형 문제 데이터를 불러오는 중 오류가 발생했어요.");
      setLoading(false);
    }
  }, [stepMeta, effectiveCourseId, effectiveSessionId]);

  const q = quizzes[index];
  const total = quizzes.length;

  const normalize = (str: string) =>
    str.trim().replace(/\s+/g, "").toLowerCase();

  const handleConfirm = () => {
    if (!q) return;
    if (!userAnswer.trim()) return;

    const correct = normalize(userAnswer) === normalize(q.correctAnswer);
    setIsCorrect(correct);
    setConfirmed(true);
  };

  // 한 문제씩 서버에 저장 (있으면)
  const sendAnswer = async (item: QuizItem, value: string) => {
    if (!effectiveCourseId || !effectiveSessionId || !stepMeta) {
      console.warn("StepE003: 답안 저장 정보 부족 → API 스킵");
      return;
    }

    try {
      const userAnswerPayload = [
        {
          contentId: item.contentId,
          value,
        },
      ];

      await submitStepAnswer({
        courseId: String(effectiveCourseId),
        sessionId: String(effectiveSessionId),
        stepId: stepMeta.stepId,
        contentType: stepMeta.contentType ?? "SHORT_ANSWER",
        userAnswer: userAnswerPayload,
      });
    } catch (e) {
      console.error("StepE003: 답안 저장 실패", e);
    }
  };

  const goNextProblem = async () => {
    if (!q) return;

    // 현재 문제 답안 서버 전송
    await sendAnswer(q, userAnswer);

    if (index < total - 1) {
      setIndex((prev) => prev + 1);
      setUserAnswer("");
      setConfirmed(false);
      setIsCorrect(null);
    } else {
      // 마지막 문제 → E004로 이동 (소요 시간 전달)
      const diffSec = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(diffSec / 60);
      const seconds = diffSec % 60;
      const durationLabel = `${minutes}분 ${seconds}초`;

      nav("/nie/session/E/step/004", {
        state: {
          durationLabel,
          articleId: aId,
          articleUrl: aUrl,
          courseId: effectiveCourseId,
          sessionId: effectiveSessionId,
          level: "E",
        },
      });
    }
  };

  const goPrev = () => {
    nav(-1);
  };

  if (loading) {
    return <div className={styles.loading}>불러오는 중…</div>;
  }

  if (loadError || !q) {
    return <div className={styles.loading}>{loadError ?? "문제가 없습니다."}</div>;
  }

  const sourceLink = q.sourceUrl || aUrl || "";

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 진행바 */}
        <div className={styles.progressWrap}>
          <div
            className={styles.progress}
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <h2 className={styles.question}>{q.question}</h2>

        {/* 입력창 */}
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.input}
            placeholder="답안을 작성하세요."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={confirmed}
          />
        </div>

        {/* 정답 확인 버튼 (정답 보기 전) */}
        {!confirmed && (
          <button
            type="button"
            className={styles.checkBtn}
            disabled={!userAnswer.trim()}
            onClick={handleConfirm}
          >
            정답 확인하기
          </button>
        )}

        {/* 정답/오답 해설 박스 */}
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
                  className={styles.sourceBtn}
                  type="button"
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
      </div>

      <EduBottomBar
        onPrev={goPrev}
        onQuit={() => nav("/learn")}
        onNext={confirmed ? goNextProblem : undefined}
        disablePrev={false}
        disableNext={!confirmed}
      />
    </div>
  );
}

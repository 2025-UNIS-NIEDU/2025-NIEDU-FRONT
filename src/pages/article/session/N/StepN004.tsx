// src/pages/article/session/N/StepN004.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { submitStepAnswer } from "@/lib/apiClient";
import EduBottomBar from "@/components/edu/EduBottomBar";
import type { StepMeta } from "@/pages/article/ArticlePrepare";
import styles from "./StepN004.module.css";

// 🔹 mock JSON (economy 패키지) – backend 없을 때 사용
import economyPackage from "@/data/economy_2025-11-24_package.json";

type Props = {
  articleId?: string;
  articleUrl?: string;

  // StepRunner 쪽에서 내려줄 수도 있는 값들(있으면 사용)
  courseId?: string;
  sessionId?: string;
  stepMeta?: StepMeta;
};

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  startTime?: number;
  courseId?: string;
  sessionId?: string;
  level?: "N" | "E" | "I";
};

// 🔹 백엔드 content JSON 타입
type QuizContentItemFromApi = {
  contentId: number;
  question: string;
  correctAnswer: "O" | "X";
  answerExplanation: string;
  sourceUrl: string;
};

// 🔹 화면에서 쓸 타입
type QuizItem = QuizContentItemFromApi;

export default function StepN004({
  articleId,
  articleUrl,
  courseId,
  sessionId,
  stepMeta,
}: Props) {
  const nav = useNavigate();
  const location = useLocation();

  // StepN003 → 넘어온 값
  const {
    articleId: sArticleId,
    articleUrl: sArticleUrl,
    startTime,
    courseId: sCourseId,
    sessionId: sSessionId,
  } = (location.state as RouteState) || {};

  const aId = sArticleId ?? articleId;
  const aUrl = sArticleUrl ?? articleUrl;
  const aCourseId = sCourseId ?? courseId;
  const aSessionId = sSessionId ?? sessionId;

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<"O" | "X" | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 stepMeta.content / mock JSON 둘 다 지원하는 파서
  useEffect(() => {
    setLoading(true);

    // 1) 백엔드에서 넘어온 stepMeta.content 우선 사용
    const raw = stepMeta?.content as any;
    let parsed: QuizItem[] | null = null;

    if (raw) {
      try {
        let obj = raw;

        // 문자열이면 JSON 파싱
        if (typeof raw === "string") {
          obj = JSON.parse(raw);
        }

        if (obj && Array.isArray(obj.contents)) {
          parsed = obj.contents as QuizItem[];
        }
      } catch (e) {
        console.warn("[StepN004] stepMeta.content 파싱 실패", e, raw);
      }
    }

    // 2) stepMeta 없거나 파싱 실패 → mock JSON(economy)에서 읽기
    if (!parsed) {
      try {
        const pkg: any = economyPackage;

        const course =
          pkg.courses?.find(
            (c: any) =>
              String(c.courseId) === String(aCourseId ?? aId ?? 1),
          ) ?? pkg.courses?.[0];

        const session =
          course?.sessions?.find(
            (s: any) =>
              String(s.sessionId) === String(aSessionId ?? 1),
          ) ?? course?.sessions?.[0];

        const quizN = session?.quizzes?.find(
          (q: any) => q.level === "N",
        );
        const step4 = quizN?.steps?.find(
          (s: any) => s.stepOrder === 4 && s.contentType === "OX_QUIZ",
        );

        if (step4 && Array.isArray(step4.contents)) {
          parsed = step4.contents as QuizItem[];
        } else {
          console.warn(
            "[StepN004] mock JSON에서 OX_QUIZ(stepOrder=4)를 찾지 못했어요.",
            { course, session, quizN, step4 },
          );
        }
      } catch (e) {
        console.error("[StepN004] mock JSON 파싱 실패", e);
      }
    }

    if (parsed) {
      setQuizzes(parsed);
    } else {
      setQuizzes([]);
    }

    setIndex(0);
    setChoice(null);
    setConfirmed(false);
    setLoading(false);
  }, [aId, aCourseId, aSessionId, stepMeta]);

  const q = quizzes[index];
  const sourceLink = q?.sourceUrl || aUrl || ""; // 🔹 원문 링크(퀴즈 > 기사 순)
  const isCorrect = !!q && choice === q.correctAnswer;

  const select = (val: "O" | "X") => {
    if (confirmed) return;
    setChoice(val);
  };

  const checkAnswer = () => {
    if (!choice) return;
    setConfirmed(true);
  };

  // ⭐ 한 문제씩 답안 저장
  const sendAnswer = async () => {
    if (!aCourseId || !aSessionId || !q || !choice) {
      console.warn(
        "StepN004: courseId/sessionId/문제/선택값 부족 → answer API 스킵",
      );
      return;
    }

    try {
      const userAnswer = [
        {
          contentId: q.contentId,
          value: choice, // "O" or "X"
        },
      ];

      // stepMeta가 있으면 거기 stepId 사용, 없으면 스킵
      if (!stepMeta?.stepId) {
        console.warn(
          "StepN004: stepId 없음 → answer API 스킵(네비게이션만)",
        );
        return;
      }

      await submitStepAnswer({
        courseId: String(aCourseId),
        sessionId: String(aSessionId),
        stepId: stepMeta.stepId,
        contentType: stepMeta.contentType ?? "OX_QUIZ",
        userAnswer,
      });
    } catch (e) {
      console.error("🔥 StepN004 answer 저장 실패:", e);
    }
  };

  const nextProblem = async () => {
    // 현재 문제 답안 서버 전송(있으면)
    await sendAnswer();

    // 마지막 문제면 StepN005로 이동
    if (index >= quizzes.length - 1) {
      nav("/nie/session/N/step/005", {
        state: {
          articleId: aId,
          articleUrl: aUrl,
          startTime,
          courseId: aCourseId,
          sessionId: aSessionId,
          level: "N",
        },
      });
      return;
    }

    // 다음 문제로
    setIndex((i) => i + 1);
    setChoice(null);
    setConfirmed(false);
  };

  if (loading) {
    return <div className={styles.loading}>불러오는 중…</div>;
  }

  if (!q) {
    return <div className={styles.loading}>퀴즈가 준비되지 않았어요.</div>;
  }

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 위쪽 메인 영역 (문제/캐릭터/OX/버튼) */}
        <div className={styles.main}>
          <div className={styles.progressWrap}>
            <div
              className={styles.progress}
              style={{
                width: `${((index + 1) / quizzes.length) * 100}%`,
              }}
            />
          </div>

          {/* ✅ 캐릭터 고정 박스 안에 넣기 */}
          <div className={styles.characterBox}>
            <img
              src={
                confirmed
                  ? isCorrect
                    ? "/icons/Frame 3.svg"
                    : "/icons/Frame 4.svg"
                  : "/icons/Frame 1.svg"
              }
              className={styles.character}
              alt=""
            />
          </div>

          <p className={styles.question}>{q.question}</p>

          <div className={styles.oxWrap}>
            <button
              className={`${styles.oxBtn} ${
                choice === "O" ? styles.selected : ""
              }`}
              onClick={() => select("O")}
            >
              O
            </button>

            <button
              className={`${styles.oxBtn} ${
                choice === "X" ? styles.selected : ""
              }`}
              onClick={() => select("X")}
            >
              X
            </button>
          </div>

          {!confirmed && (
            <button
              className={styles.checkBtn}
              disabled={!choice}
              onClick={checkAnswer}
            >
              정답 확인하기
            </button>
          )}

          {/* ✅ 항상 자리만 차지하는 영역, 안에서만 토글 */}
          <div className={styles.answerRegion}>
            {confirmed && (
              <div
                className={`${styles.answerBox} ${
                  isCorrect ? styles.ok : styles.wrong
                }`}
              >
                <div className={styles.answerTitle}>
                  <span>정답: {q.correctAnswer}</span>

                  {sourceLink && (
                    <button
                      type="button"
                      className={styles.sourceBtn}
                      onClick={() => window.open(sourceLink, "_blank")}
                    >
                      원문 보기
                    </button>
                  )}
                </div>

                <p className={styles.explanation}>
                  {q.answerExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <EduBottomBar
        onPrev={() =>
          nav("/nie/session/N/step/003", {
            state: {
              articleId: aId,
              articleUrl: aUrl,
              startTime,
              courseId: aCourseId,
              sessionId: aSessionId,
              level: "N",
            },
          })
        }
        onQuit={() => nav("/learn")}
        onNext={confirmed ? nextProblem : undefined}
        disablePrev={false}
        disableNext={!confirmed}
      />
    </div>
  );
}

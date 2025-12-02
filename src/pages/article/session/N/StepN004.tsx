// src/pages/article/session/n/StepN004.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { submitStepAnswer } from "@/lib/apiClient";
import EduBottomBar from "@/components/edu/EduBottomBar";
import type { StepMeta } from "@/pages/article/ArticlePrepare";  // ⭐ 추가
import styles from "./StepN004.module.css";

type Props = {
  articleId?: string;
  articleUrl?: string;

  // ⭐ StepRunner에서 내려줄 값들
  courseId?: string;
  sessionId?: string;
  stepMeta?: StepMeta;
};

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  startTime?: number;
};

// 🔹 백엔드 content JSON 타입
type QuizContentItemFromApi = {
  contentId: number;
  question: string;
  correctAnswer: "O" | "X";
  answerExplanation: string;
  sourceUrl: string;
};

type QuizContentFromApi = {
  contents: QuizContentItemFromApi[];
};

// 🔹 화면에서 쓸 타입(거의 그대로)
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

  // StepN003에서 넘어온 값 (시간, 기사 정보)
  const { articleId: sArticleId, articleUrl: sArticleUrl, startTime } =
    (location.state as RouteState) || {};

  const aId = sArticleId ?? articleId;
  const aUrl = sArticleUrl ?? articleUrl;

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<"O" | "X" | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 content(JSON) → 화면용 퀴즈 배열로 파싱
  useEffect(() => {
    const content = stepMeta?.content as QuizContentFromApi | undefined;

    if (content && Array.isArray(content.contents)) {
      setQuizzes(content.contents);
      setLoading(false);
      return;
    }

    // content가 아직 없으면 로딩 유지
    setLoading(false);
  }, [stepMeta]);

  const q = quizzes[index];
  const isCorrect = !!q && choice === q.correctAnswer;

  const select = (val: "O" | "X") => {
    if (confirmed) return;
    setChoice(val);
  };

  const checkAnswer = () => {
    if (!choice) return;
    setConfirmed(true);
  };

  // ⭐ 한 문제씩 답안 저장 (userAnswer JSON 스펙 맞춰서)
  const sendAnswer = async () => {
    if (!courseId || !sessionId || !stepMeta || !q || !choice) {
      console.warn(
        "StepN004: courseId/sessionId/stepMeta/문제/선택값 부족 → answer API 스킵"
      );
      return;
    }

    try {
      const userAnswer = [
        {
          contentId: q.contentId,
          value: choice, // "O" 또는 "X"
        },
      ];

      await submitStepAnswer({
        courseId,
        sessionId,
        stepId: stepMeta.stepId,
        contentType: stepMeta.contentType ?? "OX_QUIZ",
        userAnswer,
      });
    } catch (e) {
      console.error("🔥 StepN004 answer 저장 실패:", e);
    }
  };

  const nextProblem = async () => {
    // 현재 문제 답안 서버 전송
    await sendAnswer();

    // 마지막 문제면 StepN005로 이동
    if (index >= quizzes.length - 1) {
      nav("/nie/session/N/step/005", {
        state: { articleId: aId, articleUrl: aUrl, startTime, courseId, sessionId },
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
        <div className={styles.progressWrap}>
          <div
            className={styles.progress}
            style={{
              width: `${((index + 1) / quizzes.length) * 100}%`,
            }}
          />
        </div>

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

        {confirmed && (
          <div
            className={`${styles.answerBox} ${
              isCorrect ? styles.ok : styles.wrong
            }`}
          >
            <div className={styles.answerTitle}>
              정답: {q.correctAnswer}
              {aUrl && (
                <button
                  className={styles.sourceBtn}
                  onClick={() => window.open(aUrl, "_blank")}
                >
                  뉴스 원문 보기
                </button>
              )}
            </div>

            <p className={styles.explanation}>{q.answerExplanation}</p>
          </div>
        )}
      </div>

      <EduBottomBar
        onPrev={() => nav(-1)}
        onQuit={() => nav("/learn")}
        onNext={confirmed ? nextProblem : undefined}
        disablePrev
        disableNext={!confirmed}
      />
    </div>
  );
}

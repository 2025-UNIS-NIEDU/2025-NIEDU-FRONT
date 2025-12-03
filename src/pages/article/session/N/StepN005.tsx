// src/pages/article/session/N/StepN005.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN005.module.css";

// 🔹 mock JSON (economy 패키지)
import economyPackage from "@/data/economy_2025-11-24_package.json";

type Props = { articleId?: string; articleUrl?: string };

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  startTime?: number; // StepN001에서 넘어온 전체 세션 시작 시간
  courseId?: string;
  sessionId?: string;
  level?: "N" | "E" | "I";
};

// JSON에서 뽑아온 뒤 화면에서 쓸 타입
type QuizItem = {
  id: number;
  question: string;
  options: string[];
  answerIndex: number; // 0~3 (A~D)
  explanation: string;
};

export default function StepN005({ articleId, articleUrl }: Props) {
  const nav = useNavigate();
  const location = useLocation();

  // ⭐ 이전 스텝들에서 넘어온 값
  const state = (location.state as RouteState) || {};
  const aId = state.articleId ?? articleId;
  const aUrl = state.articleUrl ?? articleUrl;
  const startTime = state.startTime;
  const courseId = state.courseId;
  const sessionId = state.sessionId;

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 economy JSON → N단계, stepOrder 5, MULTIPLE_CHOICE 문제로 파싱
  useEffect(() => {
    setLoading(true);

    try {
      const pkg: any = economyPackage;

      const course =
        pkg.courses?.find(
          (c: any) =>
            String(c.courseId) === String(courseId ?? aId ?? 1)
        ) ?? pkg.courses?.[0];

      const session =
        course?.sessions?.find(
          (s: any) =>
            String(s.sessionId) === String(sessionId ?? 1)
        ) ?? course?.sessions?.[0];

      const quizN = session?.quizzes?.find(
        (q: any) => q.level === "N"
      );

      const step5 = quizN?.steps?.find(
        (s: any) =>
          s.stepOrder === 5 && s.contentType === "MULTIPLE_CHOICE"
      );

      if (step5 && Array.isArray(step5.contents)) {
        const mapped: QuizItem[] = step5.contents.map((c: any) => ({
          id: c.contentId,
          question: c.question,
          options: (c.options ?? []).map(
            (o: any) => o.text as string
          ),
          // "A" → 0, "B" → 1 ...
          answerIndex: Math.max(
            0,
            (c.correctAnswer?.charCodeAt(0) ?? 65) - 65
          ),
          explanation: c.answerExplanation,
        }));

        setQuizzes(mapped);
      } else {
        console.warn(
          "[StepN005] mock JSON에서 MULTIPLE_CHOICE(stepOrder=5)를 찾지 못했어요.",
          { course, session, quizN, step5 }
        );
        setQuizzes([]);
      }
    } catch (e) {
      console.error("[StepN005] mock JSON 파싱 실패:", e);
      setQuizzes([]);
    }

    setIndex(0);
    setChoice(null);
    setConfirmed(false);
    setLoading(false);
  }, [aId, courseId, sessionId]);

  const q = quizzes[index];
  const total = quizzes.length;

  const selectOption = (i: number) => {
    if (confirmed) return;
    setChoice(i);
  };

  const confirmAnswer = () => {
    if (choice === null) return;
    setConfirmed(true);
  };

  // ✅ 마지막 문제에서 전체 학습 시간 계산 후 결과 페이지로 이동
  const goNextProblem = () => {
    if (index < total - 1) {
      setIndex((prev) => prev + 1);
      setChoice(null);
      setConfirmed(false);
    } else {
      // 세션 전체 소요 시간 계산
      let durationLabel = "0분 0초";

      if (startTime) {
        const diffSec = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(diffSec / 60);
        const seconds = diffSec % 60;
        durationLabel = `${minutes}분 ${seconds}초`;
      }

      nav("/nie/session/N/result", {
        state: {
          streak: 2, // 일단 더미 값 (나중에 진짜 연속일수로 교체)
          durationLabel,
        },
      });
    }
  };

  const goPrev = () => {
    nav("/nie/session/N/step/004", {
      state: {
        articleId: aId,
        articleUrl: aUrl,
        startTime,
        courseId,
        sessionId,
        level: "N",
      },
    });
  };

  if (loading) {
    return <div className={styles.loading}>불러오는 중…</div>;
  }

  if (!q) {
    return <div className={styles.loading}>퀴즈가 준비되지 않았어요.</div>;
  }

  const isCorrect = choice !== null && choice === q.answerIndex;

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

        {/* 보기 리스트 */}
        <div className={styles.options}>
          {q.options.map((opt, i) => {
            const isSelected = choice === i;

            let optionClass = styles.option;

            if (!confirmed && isSelected) {
              optionClass += " " + styles.optionSelected; // 파랑
            }

            if (confirmed) {
              if (i === q.answerIndex) {
                optionClass += " " + styles.optionCorrect; // 정답(파랑)
              } else if (isSelected && i !== q.answerIndex) {
                optionClass += " " + styles.optionWrong; // 오답(빨강)
              }
            }

            const label = String.fromCharCode(65 + i); // A B C D

            return (
              <button
                key={i}
                className={optionClass}
                onClick={() => selectOption(i)}
              >
                <span className={styles.optionLabel}>{label}.</span>
                <span className={styles.optionText}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* 정답 확인 버튼 */}
        {!confirmed && (
          <button
            className={styles.checkBtn}
            disabled={choice === null}
            onClick={confirmAnswer}
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
              <span className={styles.answerLabel}>
                정답: {String.fromCharCode(65 + q.answerIndex)}
              </span>

              <button
                className={styles.sourceBtn}
                type="button"
                onClick={() => {
                  if (aUrl) window.open(aUrl, "_blank");
                }}
                disabled={!aUrl}
              >
                뉴스 원문 보기
              </button>
            </div>

            <p className={styles.answerText}>{q.explanation}</p>
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

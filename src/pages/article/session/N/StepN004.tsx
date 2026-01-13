import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN004.module.css";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

type Props = {
  articleId?: string;
  articleUrl?: string;
};

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
  sessionId?: number | string;
  level?: "N" | "E" | "I";

  steps?: StepMeta[];
};

type QuizItem = {
  contentId: number;
  question: string;
  correctAnswer: "O" | "X";
  answerExplanation: string;
  sourceUrl?: string;
};

export default function StepN004({ articleId, articleUrl }: Props) {
  const nav = useNavigate();
  const location = useLocation();

  const state = (location.state as RouteState) || {};

  const aId = state.articleId ?? articleId;
  const aUrl = state.articleUrl ?? articleUrl;
  const startTime = state.startTime;
  const courseId = state.courseId;
  const sessionId = state.sessionId;
  const steps = state.steps ?? [];

  const STEP_ORDER = 4;
  const CONTENT_TYPE = "OX_QUIZ";

  // ✅ 현재 스텝 메타(backend start 응답에서 찾음)
  const currentStep = useMemo(() => {
    return steps.find(
      (s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE
    );
  }, [steps]);

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<"O" | "X" | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // ✅ 여러 문항 답안을 누적 저장(서버가 step 단위로 전체 답안을 기대할 수 있음)
  const [answers, setAnswers] = useState<Record<number, "O" | "X">>({});

  const [loading, setLoading] = useState(true);
  const [submitErr, setSubmitErr] = useState("");

  // ✅ step.content에서 contents 파싱
  useEffect(() => {
    setLoading(true);
    setSubmitErr("");

    try {
      const contents = currentStep?.content?.contents;

      if (currentStep && Array.isArray(contents)) {
        const mapped: QuizItem[] = contents
          .map((c: any) => ({
            contentId: Number(c?.contentId ?? c?.id ?? 0),
            question: String(c?.question ?? ""),
            correctAnswer: (c?.correctAnswer ?? "O") as "O" | "X",
            answerExplanation: String(c?.answerExplanation ?? ""),
            sourceUrl: c?.sourceUrl ? String(c.sourceUrl) : undefined,
          }))
          .filter((x: QuizItem) => x.contentId && x.question);

        setQuizzes(mapped);
      } else {
        console.warn("[StepN004] step contents not found", { currentStep });
        setQuizzes([]);
      }
    } catch (e) {
      console.error("[StepN004] parse failed:", e);
      setQuizzes([]);
    }

    setIndex(0);
    setChoice(null);
    setConfirmed(false);
    setAnswers({});
    setLoading(false);
  }, [currentStep]);

  const q = quizzes[index];
  const sourceLink = q?.sourceUrl || aUrl || "";
  const isCorrect = !!q && choice === q.correctAnswer;

  const select = (val: "O" | "X") => {
    if (confirmed) return;
    setChoice(val);
  };

  // ✅ 현재 문제 답안 저장 API (누적 전송)
  const submitCurrentAnswer = async (nextAnswers: Record<number, "O" | "X">) => {
    setSubmitErr("");

    const cid = Number(courseId ?? aId);
    const sid = Number(sessionId);
    const stepId = Number(currentStep?.stepId);

    if (!cid || Number.isNaN(cid) || !sid || Number.isNaN(sid) || !stepId) {
      setSubmitErr("세션 정보가 없어서 답안을 저장할 수 없어요. (courseId/sessionId/stepId)");
      return false;
    }
    if (!q || !choice) return false;

    const userAnswer = Object.entries(nextAnswers).map(([contentId, value]) => ({
      contentId: Number(contentId),
      value,
    }));

    try {
      await api.post<ApiResponse<null>>(
        `/api/edu/courses/${cid}/sessions/${sid}/steps/${stepId}/answer`,
        {
          contentType: CONTENT_TYPE,
          userAnswer,
        }
      );
      return true;
    } catch (e) {
      console.error("[StepN004] answer submit failed:", e);
      setSubmitErr("답안 저장에 실패했어요. 네트워크/로그인 상태를 확인해주세요.");
      return false;
    }
  };

  // ✅ 정답 확인 버튼: 확인 누를 때 저장까지 같이
  const checkAnswer = async () => {
    if (!q || !choice) return;

    const next = { ...answers, [q.contentId]: choice };
    setAnswers(next);

    const ok = await submitCurrentAnswer(next);
    if (!ok) return;
    setConfirmed(true);
  };

  const nextProblem = async () => {
    // 마지막 문제면 StepN005로 이동
    if (index >= quizzes.length - 1) {
      nav("/nie/session/N/step/005", {
        state: {
          articleId: aId,
          articleUrl: aUrl,
          startTime,
          courseId,
          sessionId,
          level: "N",
          steps,
        },
      });
      return;
    }

    setIndex((i) => i + 1);
    setChoice(null);
    setConfirmed(false);
    setSubmitErr("");
  };

  if (loading) return <div className={styles.loading}>불러오는 중…</div>;
  if (!q) return <div className={styles.loading}>퀴즈가 준비되지 않았어요.</div>;

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.progressWrap}>
            <div
              className={styles.progress}
              style={{ width: `${((index + 1) / quizzes.length) * 100}%` }}
            />
          </div>

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
              className={`${styles.oxBtn} ${choice === "O" ? styles.selected : ""}`}
              onClick={() => select("O")}
            >
              O
            </button>

            <button
              className={`${styles.oxBtn} ${choice === "X" ? styles.selected : ""}`}
              onClick={() => select("X")}
            >
              X
            </button>
          </div>

          {submitErr && <div className={styles.loading}>{submitErr}</div>}

          {!confirmed && (
            <button
              className={styles.checkBtn}
              disabled={!choice}
              onClick={() => void checkAnswer()}
            >
              정답 확인하기
            </button>
          )}

          <div className={styles.answerRegion}>
            {confirmed && (
              <div className={`${styles.answerBox} ${isCorrect ? styles.ok : styles.wrong}`}>
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

                <p className={styles.explanation}>{q.answerExplanation}</p>
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
              courseId,
              sessionId,
              level: "N",
              steps,
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

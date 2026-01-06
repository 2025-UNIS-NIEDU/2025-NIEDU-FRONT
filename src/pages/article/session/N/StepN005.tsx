import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN005.module.css";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

type Props = { articleId?: string; articleUrl?: string };

type StepMeta = {
  stepId: number;
  stepOrder: number;
  isCompleted: boolean;
  contentType: string;
  content: any; // 서버에서 내려오는 구조(스텝별로 다름)
  userAnswer: any; // 이전에 푼 적 있으면 있을 수 있음
};

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  startTime?: number;
  courseId?: number | string;
  sessionId?: number | string;
  level?: "N" | "E" | "I";

  // ✅ start API에서 받아서 StepRunner/Step들로 내려주는 값들
  steps?: StepMeta[];
  progress?: number;
  entryStepId?: number;
};

// 화면에서 쓸 퀴즈 타입
type QuizItem = {
  id: number;
  question: string;
  options: string[]; // ["보기1","보기2","보기3","보기4"]
  answerIndex: number; // 0~3
  explanation: string;
};

export default function StepN005({ articleId, articleUrl }: Props) {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState) || {};

  const aId = state.articleId ?? articleId;
  const aUrl = state.articleUrl ?? articleUrl;
  const startTime = state.startTime;

  const courseId = state.courseId;
  const sessionId = state.sessionId;
  const steps = state.steps ?? [];

  // ✅ StepN005는 "N 레벨의 stepOrder=5"에 해당 (객관식)
  const STEP_ORDER = 5;
  const CONTENT_TYPE = "MULTIPLE_CHOICE";

  const currentStep = useMemo(() => {
    // stepOrder로 찾는 방식 (StepRunner가 stepOrder 라우팅 쓰는 구조라 안전)
    return steps.find(
      (s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE
    );
  }, [steps]);

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitErr, setSubmitErr] = useState("");

  // ✅ start 응답의 step.content에서 퀴즈 contents를 뽑아서 렌더링
  useEffect(() => {
    setLoading(true);
    setSubmitErr("");

    try {
      // 보통 서버 구조: step.content 안에 contents가 있고 그 안에 contentId/question/options/correctAnswer/answerExplanation
      const contents = currentStep?.content?.contents;

      if (currentStep && Array.isArray(contents)) {
        const mapped: QuizItem[] = contents.map((c: any) => ({
          id: Number(c?.contentId ?? c?.id ?? 0),
          question: String(c?.question ?? ""),
          options: Array.isArray(c?.options)
            ? c.options.map((o: any) => String(o?.text ?? o))
            : [],
          answerIndex: Math.max(0, (c?.correctAnswer?.charCodeAt(0) ?? 65) - 65),
          explanation: String(c?.answerExplanation ?? ""),
        }));

        setQuizzes(mapped);
      } else {
        console.warn("[StepN005] currentStep/contents not found", {
          currentStep,
          stepsLen: steps.length,
        });
        setQuizzes([]);
      }
    } catch (e) {
      console.error("[StepN005] parse step content failed:", e);
      setQuizzes([]);
    }

    setIndex(0);
    setChoice(null);
    setConfirmed(false);
    setLoading(false);
  }, [currentStep, steps.length]);

  const q = quizzes[index];
  const total = quizzes.length;

  const selectOption = (i: number) => {
    if (confirmed) return;
    setChoice(i);
  };

  // ✅ 답 제출 API
  const submitAnswer = async () => {
    setSubmitErr("");

    // 필수값 체크
    const cid = Number(courseId ?? aId);
    const sid = Number(sessionId);
    const stepId = Number(currentStep?.stepId);

    if (!cid || Number.isNaN(cid) || !sid || Number.isNaN(sid) || !stepId) {
      setSubmitErr("세션 정보가 없어서 답안을 저장할 수 없어요. (courseId/sessionId/stepId)");
      return false;
    }
    if (choice === null) return false;

    // userAnswer 형식: 4지선다는 "A"/"B"/"C"/"D"
    const userAnswer = String.fromCharCode(65 + choice);

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
      console.error("[StepN005] submit answer error:", e);
      setSubmitErr("답안 저장에 실패했어요. 네트워크/로그인 상태를 확인해주세요.");
      return false;
    }
  };

  // ✅ 정답 확인 버튼: 확인 누를 때 서버에 저장까지 같이 처리
  const confirmAnswer = async () => {
    if (choice === null) return;
    const ok = await submitAnswer();
    if (!ok) return; // 저장 실패하면 확인 상태로 못 넘어가게 (원하면 바꿀 수 있음)
    setConfirmed(true);
  };

  // ✅ 마지막 문제에서 결과 페이지 이동 (일단 기존 로직 유지)
  const goNextProblem = () => {
    if (index < total - 1) {
      setIndex((prev) => prev + 1);
      setChoice(null);
      setConfirmed(false);
      setSubmitErr("");
    } else {
      let durationLabel = "0분 0초";

      if (startTime) {
        const diffSec = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(diffSec / 60);
        const seconds = diffSec % 60;
        durationLabel = `${minutes}분 ${seconds}초`;
      }

      // ✅ TODO(다음 단계): 여기서 summary API 호출해서 streak/learningTime 실제값으로 교체 가능
      nav("/nie/session/N/result", {
        state: {
          streak: 2, // 임시
          durationLabel,
          courseId,
          sessionId,
          level: "N",
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
        steps, // ✅ steps 유지해서 이전/다음 스텝에서도 계속 사용 가능
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
              optionClass += " " + styles.optionSelected;
            }
            if (confirmed) {
              if (i === q.answerIndex) optionClass += " " + styles.optionCorrect;
              else if (isSelected) optionClass += " " + styles.optionWrong;
            }

            const label = String.fromCharCode(65 + i);

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

        {/* 저장 실패 메시지 */}
        {submitErr && <div className={styles.loading}>{submitErr}</div>}

        {/* 정답 확인 버튼 */}
        {!confirmed && (
          <button
            className={styles.checkBtn}
            disabled={choice === null}
            onClick={() => void confirmAnswer()}
          >
            정답 확인하기
          </button>
        )}

        {/* 해설 박스 */}
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

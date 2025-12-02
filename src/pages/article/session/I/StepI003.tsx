// pages/article/session/I/StepI003.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import styles from "./StepI003.module.css";

type Props = { articleId?: string; articleUrl?: string };

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  courseId?: string;
  sessionId?: string;
  stepId?: number;
  // 필요하면 stepMeta 타입 지정해서 써도 됨 (지금은 any로 처리)
  stepMeta?: any;
};

type StepI003Content = {
  sourceUrl: string;
  contents: {
    contentId: number;
    question: string;
    options: {
      label: string; // "A" | "B" | "C" | "D"
      text: string;
    }[];
    correctAnswer: string; // "A" | "B" | "C" | "D"
    answerExplanation: string;
  }[];
};

export default function StepI003({ articleId, articleUrl }: Props) {
  const nav = useNavigate();
  const location = useLocation();

  const {
    articleId: sArticleId,
    articleUrl: sArticleUrl,
    courseId,
    sessionId,
    stepId,
    stepMeta,
  } = (location.state as RouteState) || {};

  const aId = sArticleId ?? articleId;
  const aUrl = sArticleUrl ?? articleUrl;

  const [quizzes, setQuizzes] = useState<StepI003Content["contents"]>([]);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [choiceLabel, setChoiceLabel] = useState<string | null>(null); // "A" | "B" ...
  const [confirmed, setConfirmed] = useState(false);

  const CONTENT_TYPE = "MULTIPLE_CHOICE";

  // 🔹 백엔드 stepMeta.content 로부터 문제 세팅
  useEffect(() => {
    const content = stepMeta?.content as StepI003Content | undefined;

    if (content && Array.isArray(content.contents)) {
      setQuizzes(content.contents);
      setSourceUrl(content.sourceUrl || null);
    } else {
      console.warn("StepI003: stepMeta.content 가 비어있어요.", stepMeta);
    }
  }, [stepMeta]);

  const q = quizzes[index];
  const total = quizzes.length;
  const isCorrect = choiceLabel === q?.correctAnswer;

  const selectOption = (label: string) => {
    if (confirmed) return;
    setChoiceLabel(label);
  };

  const confirmAnswer = () => {
    if (!choiceLabel) return;
    setConfirmed(true);
  };

  // 🔹 userAnswer = [{ contentId, value }] 형식으로 저장
  const sendAnswer = async () => {
    if (!courseId || !sessionId || !stepId || !q) {
      console.warn("StepI003: courseId/sessionId/stepId/q 없음 → API 스킵");
      return;
    }

    const userAnswer = [
      {
        contentId: q.contentId,
        value: choiceLabel, // "A" | "B" | "C" | "D"
      },
    ];

    try {
      await submitStepAnswer({
        courseId,
        sessionId,
        stepId,
        contentType: CONTENT_TYPE,
        userAnswer,
      });
    } catch (e) {
      console.error("🔥 StepI003 답안 저장 실패:", e);
    }
  };

  const nextProblem = async () => {
    // 현재 문제 답안 저장
    await sendAnswer();

    if (index < total - 1) {
      setIndex((i) => i + 1);
      setChoiceLabel(null);
      setConfirmed(false);
      return;
    }

    // 마지막 문제 → I004로 이동
    nav("/nie/session/I/step/004", {
      state: {
        articleId: aId,
        articleUrl: aUrl,
        courseId,
        sessionId,
        // 필요하면 여기서 stepMeta(I004용)도 같이 넘겨줄 수 있음
      },
    });
  };

  const goPrev = () => {
    nav(-1);
  };

  if (!q) {
    return <div className={styles.loading}>불러오는 중…</div>;
  }

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
          {q.options.map((opt) => {
            const selected = choiceLabel === opt.label;

            let cls = styles.option;

            if (!confirmed && selected) {
              cls += " " + styles.optionSelected;
            }

            if (confirmed) {
              if (opt.label === q.correctAnswer) {
                cls += " " + styles.optionCorrect;
              } else if (selected && opt.label !== q.correctAnswer) {
                cls += " " + styles.optionWrong;
              }
            }

            return (
              <button
                key={opt.label}
                className={cls}
                type="button"
                onClick={() => selectOption(opt.label)}
              >
                <span className={styles.optionLabel}>{opt.label}.</span>
                <span className={styles.optionText}>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* 정답 확인 버튼 */}
        {!confirmed && (
          <button
            className={styles.checkBtn}
            type="button"
            disabled={!choiceLabel}
            onClick={confirmAnswer}
          >
            정답 확인하기
          </button>
        )}

        {/* 정답/오답 해설 */}
        {confirmed && (
          <div
            className={`${styles.answerBox} ${
              isCorrect ? styles.answerBoxCorrect : styles.answerBoxWrong
            }`}
          >
            <div className={styles.answerHeader}>
              <span className={styles.answerLabel}>
                정답: {q.correctAnswer}
              </span>
              <button
                className={styles.sourceBtn}
                type="button"
                disabled={!sourceUrl}
                onClick={() => {
                  if (sourceUrl) window.open(sourceUrl, "_blank");
                }}
              >
                뉴스 원문 보기
              </button>
            </div>
            <p className={styles.answerText}>{q.answerExplanation}</p>
          </div>
        )}

        <div className={styles.bottomSpace} />
      </div>

      <EduBottomBar
        onPrev={goPrev}
        onQuit={() => nav("/learn")}
        onNext={confirmed ? nextProblem : undefined}
        disablePrev={false}
        disableNext={!confirmed}
      />
    </div>
  );
}

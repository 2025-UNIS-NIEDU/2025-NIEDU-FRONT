// src/pages/article/session/I/StepI003.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import styles from "./StepI003.module.css";

import iPackage from "@/data/economy_2025-11-24_package.json";

type Props = { articleId?: string; articleUrl?: string };

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  courseId?: string;
  sessionId?: string;
  stepId?: number;
  stepMeta?: any;
};

type QuizItem = {
  contentId: number;
  question: string;
  options: {
    label: string;
    text: string;
  }[];
  correctAnswer: string;
  answerExplanation: string;
};

type StepI003Content = {
  sourceUrl: string;
  contents: QuizItem[];
};

const CONTENT_TYPE = "MULTIPLE_CHOICE";

// 🔍 JSON 어디에 있든 contentType === "MULTIPLE_CHOICE" 인 블록 찾아오기
function findMultipleChoice(node: any): StepI003Content | undefined {
  if (!node) return undefined;

  // 1) 배열이면 각 요소 순회
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findMultipleChoice(item);
      if (found) return found;
    }
    return undefined;
  }

  // 2) 객체이면 우선 자기 자신 검사
  if (typeof node === "object") {
    if (
      node.contentType === "MULTIPLE_CHOICE" &&
      Array.isArray(node.contents)
    ) {
      const sourceUrl =
        node.sourceUrl ??
        node.contents[0]?.sourceUrl ??
        "";

      return {
        sourceUrl,
        contents: node.contents as QuizItem[],
      };
    }

    // 3) 프로퍼티들 안으로 재귀
    for (const key of Object.keys(node)) {
      const value = (node as any)[key];
      const found = findMultipleChoice(value);
      if (found) return found;
    }
  }

  return undefined;
}

// JSON 전체에서 한 번만 찾아서 캐싱
const MULTIPLE_FROM_PACKAGE: StepI003Content | undefined =
  findMultipleChoice(iPackage as any);

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

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [choiceLabel, setChoiceLabel] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    // 1순위: 백엔드 stepMeta.content
    const fromMeta = stepMeta?.content as StepI003Content | undefined;
    const content = fromMeta ?? MULTIPLE_FROM_PACKAGE;

    if (content && Array.isArray(content.contents)) {
      setQuizzes(content.contents);
      setSourceUrl(content.sourceUrl || null);
    } else {
      console.warn("StepI003: MULTIPLE_CHOICE 데이터를 찾을 수 없음", {
        stepMeta,
        MULTIPLE_FROM_PACKAGE,
        rawPkg: iPackage,
      });
    }
  }, [stepMeta]);

  const q = quizzes[index];
  const total = quizzes.length;
  const isCorrect = q && choiceLabel === q.correctAnswer;

  const selectOption = (label: string) => {
    if (confirmed) return;
    setChoiceLabel(label);
  };

  const confirmAnswer = () => {
    if (!choiceLabel) return;
    setConfirmed(true);
  };

  const sendAnswer = async () => {
    if (!courseId || !sessionId || !stepId || !q) {
      console.warn("StepI003: courseId/sessionId/stepId/q 없음 → API 스킵");
      return;
    }

    const userAnswer = [
      {
        contentId: q.contentId,
        value: choiceLabel,
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
    await sendAnswer();

    if (index < total - 1) {
      setIndex((i) => i + 1);
      setChoiceLabel(null);
      setConfirmed(false);
      return;
    }

nav("/nie/session/I/step/004", {
  state: {
    level: "I",          // ✅ 요거 추가
    articleId: aId,
    articleUrl: aUrl,
    courseId,
    sessionId,
  },
});

  };

  const goPrev = () => nav(-1);

  if (!q) {
    // JSON 탐색 실패했을 때 여기 걸림
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

// src/pages/article/session/I/StepI004.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepI004.module.css";

// 🔹 I 단계 패키지 JSON 전체 import
import iPackageJson from "@/data/economy_2025-11-24_package.json";

type Props = { articleId?: string; articleUrl?: string };

type RouteState = {
  articleId?: string;
  articleUrl?: string;
};

type QuizItem = {
  id: number;
  question: string;
  answer: string;      // 정답 텍스트
  explanation: string; // 해설
};

type ShortAnswerContent = {
  sourceUrl: string;
  items: QuizItem[];
};

// 🔍 JSON 어디에 있든 SHORT_ANSWER 블록 찾아오기
function findShortAnswer(node: any): ShortAnswerContent | undefined {
  if (!node) return undefined;

  // 배열이면 요소들 순회
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findShortAnswer(item);
      if (found) return found;
    }
    return undefined;
  }

  // 객체면 자기 자신 먼저 검사
  if (typeof node === "object") {
    if (
      node.contentType === "SHORT_ANSWER" &&
      Array.isArray(node.contents) &&
      node.contents.length > 0
    ) {
      const contents = node.contents.map((c: any) => ({
        id: c.contentId,
        question: c.question,
        answer: c.correctAnswer,
        explanation: c.answerExplanation,
      })) as QuizItem[];

      const sourceUrl =
        node.sourceUrl ??
        node.contents[0]?.sourceUrl ??
        "";

      return { sourceUrl, items: contents };
    }

    // 프로퍼티들 안으로 재귀
    for (const key of Object.keys(node)) {
      const value = (node as any)[key];
      const found = findShortAnswer(value);
      if (found) return found;
    }
  }

  return undefined;
}

// JSON 전체에서 한 번만 찾아서 캐싱
const SHORT_FROM_PACKAGE: ShortAnswerContent | undefined = findShortAnswer(
  iPackageJson as any
);

export default function StepI004({ articleId, articleUrl }: Props) {
  const nav = useNavigate();
  const location = useLocation();

  const state = (location.state as RouteState) || {};
  const aId = state.articleId ?? articleId;
  const aUrl = state.articleUrl ?? articleUrl;

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [startTime] = useState(() => Date.now());

  // 🔹 JSON에서 SHORT_ANSWER 가져오기
  useEffect(() => {
    if (SHORT_FROM_PACKAGE) {
      setQuizzes(SHORT_FROM_PACKAGE.items);
      setSourceUrl(SHORT_FROM_PACKAGE.sourceUrl);
    } else {
      console.warn("[StepI004] SHORT_ANSWER 데이터를 찾을 수 없음", {
        SHORT_FROM_PACKAGE,
        rawPkg: iPackageJson,
      });
    }
  }, []);

  const q = quizzes[index];
  const total = quizzes.length;

  const normalize = (str: string) =>
    str.trim().replace(/\s+/g, "").toLowerCase();

  const handleConfirm = () => {
    if (!q) return;
    if (!userAnswer.trim()) return;

    const correct = normalize(userAnswer) === normalize(q.answer);
    setIsCorrect(correct);
    setConfirmed(true);
  };

const goNextProblem = () => {
  if (index < total - 1) {
    setIndex((prev) => prev + 1);
    setUserAnswer("");
    setConfirmed(false);
    setIsCorrect(null);
  } else {
    const diffSec = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(diffSec / 60);
    const seconds = diffSec % 60;
    const durationLabel = `${minutes}분 ${seconds}초`;

    nav("/nie/session/N/result", {
      state: {
        streak: 2,       // ✅ N005와 똑같이
        durationLabel,   // ✅ 결과 페이지가 쓰는 값
      },
    });
  }
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
        {/* 진행바: 문제 수 기준 */}
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
          />
        </div>

        {/* 정답 확인 버튼 */}
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
              <span className={styles.answerLabel}>정답: {q.answer}</span>

              <button
                className={styles.sourceBtn}
                type="button"
                disabled={!sourceUrl && !aUrl}
                onClick={() => {
                  const url = sourceUrl ?? aUrl;
                  if (url) window.open(url, "_blank");
                }}
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

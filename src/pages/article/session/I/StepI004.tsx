import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepI004.module.css";

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

export default function StepI004({ articleId, articleUrl }: Props) {
  const nav = useNavigate();
  const location = useLocation();

  const state = (location.state as RouteState) || {};
  const aId = state.articleId ?? articleId;
  const aUrl = state.articleUrl ?? articleUrl;

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // 이 단계에서 걸린 시간(원하면 결과 페이지에서 쓸 수 있음)
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    const dummy: QuizItem[] = [
      {
        id: 1,
        question: "한국과 싱가포르가 수립한 관계는 무엇인가요?",
        answer: "전략적 동반자 관계",
        explanation:
          "정상회담에서 두 나라는 ‘전략적 동반자 관계’를 수립했다고 발표했습니다.",
      },
      {
        id: 2,
        question: "정상회담이 열린 나라는 어디인가요?",
        answer: "대한민국",
        explanation:
          "요약문에서 이번 정상회담은 한국 용산 대통령실에서 열렸다고 설명합니다.",
      },
      {
        id: 3,
        question: "정상회담이 열린 해는 몇 년도인가요?",
        answer: "2023년",
        explanation:
          "기사에서 2023년 10월 2일에 열린 정상회담이라고 명시되어 있습니다.",
      },
      {
        id: 4,
        question:
          "양국이 이번 정상회담을 통해 특히 점검한 것은 무엇인가요?",
        answer: "양국 관계의 훌륭한 상태",
        explanation:
          "정상회담을 통해 양국 관계의 훌륭한 상태를 점검하고 확인했습니다.",
      },
      {
        id: 5,
        question: "두 나라가 협력 강화를 논의한 계기는 수교 몇 주년이기 때문인가요?",
        answer: "50주년",
        explanation:
          "올해는 한국과 싱가포르 수교 50주년으로, 이를 계기로 협력 강화를 논의했습니다.",
      },
    ];

    setQuizzes(dummy);
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
      // 이 단계 시간 계산(원하면 결과 페이지에서 사용)
      const diffSec = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(diffSec / 60);
      const seconds = diffSec % 60;
      const durationLabel = `${minutes}분 ${seconds}초`;

      nav("/nie/session/N/result", {
        state: {
          durationLabel,
          articleId: aId,
          articleUrl: aUrl,
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
        {/* 진행바: 5문제 기준 */}
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
              <span className={styles.answerLabel}>
                정답: {q.answer}
              </span>

              <button
                className={styles.sourceBtn}
                type="button"
                disabled={!aUrl}
                onClick={() => {
                  if (aUrl) window.open(aUrl, "_blank");
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

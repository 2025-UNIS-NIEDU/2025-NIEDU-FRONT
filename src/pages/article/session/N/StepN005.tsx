// pages/article/session/n/StepN005.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN005.module.css";

type Props = { articleId?: string; articleUrl?: string };

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  startTime?: number; // ⭐ StepN001에서 넘어온 전체 세션 시작 시간
};
type StepN005Content = {
  sourceUrl: string;
  contents: {
    contentId: number;
    question: string;
    options: { label: string; text: string }[];
    correctAnswer: string; // "A"~"D"
    answerExplanation: string;
  }[];
};
type QuizItem = {
  id: number;
  question: string;
  options: string[];
  answerIndex: number; // 0~3
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

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // 더미 데이터 (나중에 API 연동)
  useEffect(() => {
    const dummy: QuizItem[] = [
      {
        id: 1,
        question: "이재명 대통령과 웡 총리가 만난 장소는 어디인가요?",
        options: ["용산 대통령실", "청와대", "싱가포르", "국회"],
        answerIndex: 0,
        explanation:
          "이재명 대통령과 웡 총리는 한국 용산 대통령실에서 정상회담을 가졌습니다.",
      },
      {
        id: 2,
        question: "정상회담에서 두 나라가 새로 수립한 관계는 무엇인가요?",
        options: ["전략적 동반자 관계", "군사 동맹", "경제 통합체", "환경 협력 파트너"],
        answerIndex: 0,
        explanation:
          "양국은 이번 정상회담을 통해 ‘전략적 동반자 관계’를 공식적으로 수립했습니다.",
      },
      {
        id: 3,
        question: "정상회담이 열린 해는 언제인가요?",
        options: ["2021년", "2022년", "2023년", "2024년"],
        answerIndex: 2,
        explanation:
          "해당 기사 내용은 2023년 10월 2일에 열린 한·싱가포르 정상회담을 다루고 있습니다.",
      },
      {
        id: 4,
        question: "정상회담에서 특히 강화하기로 한 분야가 아닌 것은?",
        options: ["경제 협력", "안보 협력", "우주 탐사 협력", "첨단 산업 협력"],
        answerIndex: 2,
        explanation:
          "기사는 경제·안보·첨단 산업 등 실질 협력 강화를 다루며, 우주 탐사 협력은 언급되지 않습니다.",
      },
      {
        id: 5,
        question: "수교 몇 주년을 계기로 관계 강화를 논의했나요?",
        options: ["10주년", "25주년", "50주년", "70주년"],
        answerIndex: 2,
        explanation:
          "올해는 한국과 싱가포르 수교 50주년으로, 이를 계기로 양국 관계 강화를 논의했습니다.",
      },
    ];

    setQuizzes(dummy);
  }, []);

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
          streak: 2,       // 일단 더미 값 (나중에 진짜 연속일수로 교체)
          durationLabel,   // ⭐ 결과 화면에서 보여줄 "6분 2초" 형식 문자열
        },
      });
    }
  };

  const goPrev = () => {
    nav("/nie/session/N/step/004", {
      state: { articleId: aId, articleUrl: aUrl, startTime },
    });
  };

  if (!q) {
    return <div className={styles.loading}>불러오는 중…</div>;
  }

  const isCorrect = choice !== null && choice === q.answerIndex;

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

              {/* 항상 노출, URL 없으면 disabled */}
              <button
                className={styles.sourceBtn}
                onClick={() => {
                  if (aUrl) window.open(aUrl, "_blank");
                }}
                type="button"
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

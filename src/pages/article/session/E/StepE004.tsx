// src/pages/article/session/E/StepE004.tsx

import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepE004.module.css";

type Props = { articleId?: string; articleUrl?: string };

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  level?: "N" | "E" | "I";
  durationLabel?: string;

  // 🔹 AI 채점 결과 (백엔드 연동 시 여기 채워서 넘기면 됨)
  aiScore?: number; // 0~100
  aiComment?: string;
  aiFeedback?: {
    meaning: string;
    context: string;
    wording: string;
  };
  userAnswer?: string;
};

export default function StepE004({ articleId, articleUrl }: Props) {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: RouteState };

  const effectiveArticleId = state?.articleId ?? articleId;
  const effectiveArticleUrl = state?.articleUrl ?? articleUrl;

  // 🔹 점수 / 한줄 코멘트
  const score = state?.aiScore ?? 10;

  const comment =
    state?.aiComment ??
    (score < 40
      ? "좀더 생각해봐요."
      : score < 80
      ? "좋아요, 이 부분만 보완해 보면 좋겠어요."
      : "오늘도 너무 잘했어요!");

  // 🔹 피드백(의미/맥락/문법) – state 없으면 예시 문구 사용
  const feedback = state?.aiFeedback ?? {
    meaning:
      "핵심 의미가 완전히 반대입니다. ‘전략적 동반자 관계 수립’은 긍정적 관계 형성을 의미하지만, ‘긴밀한 관계를 끊음’은 부정적 관계 단절을 나타냅니다.",
    context:
      "문맥 흐름이 완전히 단절되었습니다. 전략적 동반자 관계 수립과 긴밀한 관계 단절은 서로 반대 의미입니다.",
    wording:
      "문장이 간결하고 명확합니다. 그러나 ‘끊었습니다’ 대신 ‘끊어졌습니다’로 표현하면 더 자연스럽습니다.",
  };

  const userAnswer =
    state?.userAnswer ?? "긴밀한 관계를 끊었습니다.";

  // 🔹 점수 구간 라벨 (~40점, 41~79점, 80점 이상)
  const scoreBandLabel =
    score < 40 ? "~40점" : score < 80 ? "41~79점" : "80점 이상";

  // 🔹 점수에 따른 마스코트
  const mascotSrc =
    score < 40
      ? "/mascots/edu-sad.png"
      : score < 80
      ? "/mascots/edu-normal.png"
      : "/mascots/edu-happy.png";

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 진행 바 (E단계 마지막이니 거의 꽉 찬 느낌으로) */}
        <div className={styles.progressWrap}>
          <div className={styles.progress} />
        </div>

        {/* 상단 점수 영역 */}
        <div className={styles.scoreBox}>
          <img src={mascotSrc} alt="" className={styles.mascot} />
          <div className={styles.scoreTexts}>
            <p className={styles.score}>{score}점</p>
            <p className={styles.scoreComment}>{comment}</p>
          </div>
        </div>

        {/* AI 피드백 타이틀 */}
        <p className={styles.sectionTitle}>AI 피드백</p>

        {/* 피드백 카드 */}
        <section className={styles.feedbackCard}>
          <div className={styles.feedbackBlock}>
            <h3 className={styles.feedbackHeading}>의미</h3>
            <p className={styles.feedbackText}>{feedback.meaning}</p>
          </div>

          <div className={styles.feedbackDivider} />

          <div className={styles.feedbackBlock}>
            <h3 className={styles.feedbackHeading}>맥락</h3>
            <p className={styles.feedbackText}>{feedback.context}</p>
          </div>

          <div className={styles.feedbackDivider} />

          <div className={styles.feedbackBlock}>
            <h3 className={styles.feedbackHeading}>문법</h3>
            <p className={styles.feedbackText}>{feedback.wording}</p>
          </div>
        </section>

        {/* 하단 점수 구간 + userAnswer 표시 (피그마 하단 영역 느낌) */}
        <div className={styles.metaBox}>
          <span className={styles.scoreBand}>{scoreBandLabel}</span>
          <span className={styles.userAnswerLabel}>
            "userAnswer": "{userAnswer}"
          </span>
        </div>

        <div className={styles.bottomSpace} />
      </div>

      <EduBottomBar
        onPrev={() => nav(-1)}
        onQuit={() => nav("/learn")}
        onNext={() =>
          nav("/learn", {
            state: {
              articleId: effectiveArticleId,
              articleUrl: effectiveArticleUrl,
              level: "E",
            },
          })
        }
        disablePrev={false}
        disableNext={false}
      />
    </div>
  );
}

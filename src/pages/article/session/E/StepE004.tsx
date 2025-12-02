import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepE004.module.css";

type Props = { articleId?: string; articleUrl?: string };

type RouteState = {
  articleId?: string;
  articleUrl?: string;
};

type FeedbackSection = {
  title: string;   // "의미", "맥락", "문법" 같은 섹션 제목
  content: string; // 해당 섹션 내용
};

type ApiResp = {
  question: string;
  score: number;
  feedback: FeedbackSection[];
};

export default function StepE004({ articleId, articleUrl }: Props) {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: RouteState };

  const aId = state?.articleId ?? articleId;
  const aUrl = state?.articleUrl ?? articleUrl;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    let aborted = false;

    (async () => {
      try {
        // ✅ 나중에 실제 API 엔드포인트/파라미터로 수정
        const res = await fetch("/api/nie/e/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId: aId,
            articleUrl: aUrl,
          }),
        });

        if (!res.ok) {
          throw new Error("API 호출 실패");
        }

        const json = (await res.json()) as ApiResp;

        if (!aborted) {
          setData(json);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);

        // 🔁 임시 더미 데이터 (백엔드 붙기 전까지)
        if (!aborted) {
          const dummy: ApiResp = {
            question: "한국과 싱가포르가 ______ 관계를 수립했다.",
            score: 10,
            feedback: [
              {
                title: "의미",
                content:
                  "핵심 의미가 완전히 반대입니다. '전략적 동반자 관계 수립'은 긍정적 관계 형성을 의미하지만, '긴밀한 관계를 끊음'은 부정적 관계 단절을 나타냅니다.",
              },
              {
                title: "맥락",
                content:
                  "문맥 흐름이 완전히 단절되었습니다. 전략적 동반자 관계 수립과 긴밀한 관계 단절은 반대 의미입니다.",
              },
              {
                title: "문법",
                content:
                  "문장이 간결하고 명확합니다. 그러나 '끊었습니다' 대신 '맺었습니다'로 표현하면 더 자연스럽습니다.",
              },
            ],
          };

          setData(dummy);
          setError("임시 더미 데이터로 표시 중입니다. (API 연결 전)");
          setLoading(false);
        }
      }
    })();

    return () => {
      aborted = true;
    };
  }, [aId, aUrl]);

  const score = data?.score ?? 0;

  // ✅ 점수 구간별 이모지/멘트
  const scoreView = (() => {
    if (score <= 40) {
      return {
        emojiSrc: "/icons/emotion-sad.svg", // 울고 있는 이모지
        emojiAlt: "아쉬운 표정 이모지",
        message: "좀더 생각해봐요.",
      };
    }
    if (score <= 79) {
      return {
        emojiSrc: "/icons/emotion-good.svg", // 신난/좋은 이모지
        emojiAlt: "기뻐하는 이모지",
        message: "좋아요. 이 부분만 수정하면 될 것 같아요.",
      };
    }
    return {
      emojiSrc: "/icons/emotion-great.svg", // 아주 신난 이모지
      emojiAlt: "아주 즐거운 이모지",
      message: "오늘 열심히 학습 했군요! 너무 잘했어요.",
    };
  })();

  const handlePrev = () => nav(-1);

  // 마지막 단계라고 가정하고, 다음 → 학습 홈으로 이동
  const handleNext = () => nav("/learn");

  const handleOpenArticle = () => {
    if (!aUrl) return;
    window.open(aUrl, "_blank", "noopener,noreferrer");
  };

  if (loading || !data) {
    return (
      <div className={styles.viewport}>
        <div className={styles.container}>
          <div className={styles.progressWrap}>
            <div className={styles.progress} style={{ width: "100%" }} />
          </div>
          <p className={styles.loading}>AI 피드백 생성 중…</p>
        </div>
        <EduBottomBar onPrev={handlePrev} disableNext disablePrev />
      </div>
    );
  }

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 진행바 */}
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "100%" }} />
        </div>

        {/* 문제(질문) 표시 */}
        <h1 className={styles.question}>{data.question}</h1>

        {/* 점수 카드 */}
        <section className={styles.scoreCard}>
          <div className={styles.emojiWrapper}>
            <img
              src={scoreView.emojiSrc}
              alt={scoreView.emojiAlt}
              className={styles.emoji}
            />
          </div>

          <div className={styles.scoreText}>
            <p className={styles.scoreNumber}>{score}점</p>
            <p className={styles.scoreMessage}>{scoreView.message}</p>
          </div>
        </section>

        {/* AI 피드백 */}
        <section className={styles.feedbackSection}>
          <h2 className={styles.feedbackTitle}>AI 피드백</h2>

          <div className={styles.feedbackCard}>
            {error && <p className={styles.errorText}>{error}</p>}

            {data.feedback.map((f) => (
              <div key={f.title} className={styles.feedbackBlock}>
                <h3 className={styles.feedbackBlockTitle}>{f.title}</h3>
                <p className={styles.feedbackBlockBody}>{f.content}</p>
              </div>
            ))}

            {/* 원문 보기 (선택사항) */}
            {aUrl && (
              <button
                type="button"
                className={styles.sourceLink}
                onClick={handleOpenArticle}
              >
                기사 원문 보기
              </button>
            )}
          </div>
        </section>

        {/* 오류 제보하기 버튼 */}
        <div className={styles.reportWrapper}>
          <button
            type="button"
            className={styles.reportButton}
            onClick={() => setShowReportModal(true)}
          >
            오류 제보하기
          </button>
        </div>

        <div className={styles.bottomSpace} />
      </div>

      {/* 하단 GNB */}
      <EduBottomBar
        onPrev={handlePrev}
        onNext={handleNext}
        onQuit={() => nav("/learn")}
      />

      {/* 오류 제보 모달 */}
      {showReportModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>AI 답변에 오류가 있나요?</h3>
            <p className={styles.modalDesc}>
              NIEdu에게 알려주세요.
              <br />
              더 나은 서비스를 만드는 데 도움이 됩니다.
            </p>

            <div className={styles.modalButtons}>
              <button
                type="button"
                className={styles.modalButtonSecondary}
                onClick={() => setShowReportModal(false)}
              >
                닫기
              </button>
              <button
                type="button"
                className={styles.modalButtonPrimary}
                onClick={() => {
                  // TODO: 실제 오류 제보 API 연동
                  setShowReportModal(false);
                  alert("오류 제보가 접수되었습니다. 감사합니다!");
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

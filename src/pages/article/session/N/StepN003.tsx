// src/pages/article/session/n/StepN003.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { submitStepAnswer } from "@/lib/apiClient"; // ⭐ 정답 API
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN003.module.css";

type Props = { articleId?: string; articleUrl?: string };

type IssueData = {
  issue: string;
  cause: string;
  situation: string;
  result: string;
  impact: string;
};

// ⭐ StepN002 → 넘어오는 state 타입
type RouteState = {
  articleId?: string;
  articleUrl?: string;
  startTime?: number;
  courseId?: string;
  sessionId?: string;
  stepId?: number; // 백엔드 stepId (예: 3)
};

export default function StepN003({ articleId, articleUrl }: Props) {
  const nav = useNavigate();
  const location = useLocation();

  // ⭐ state에서 값 가져오기
  const {
    articleId: sArticleId,
    articleUrl: sArticleUrl,
    startTime,
    courseId,
    sessionId,
    stepId,
  } = (location.state as RouteState) || {};

  const aId = sArticleId ?? articleId;
  const aUrl = sArticleUrl ?? articleUrl;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IssueData | null>(null);

  useEffect(() => {
    let abort = false;

    (async () => {
      // TODO: 나중에 백엔드 content로 교체
      const resp: IssueData = {
        issue: "한-싱가포르 전략적 동반자 관계 수립",
        cause:
          "한국과 싱가포르는 수교 50주년을 맞아 양국 간의 관계를 강화하기 위해 전략적 동반자 관계를 수립하기로 결정했다. 이는 변화하는 경제 및 안보 환경에 대응하기 위한 필요성에서 비롯되었다.",
        situation:
          "이 과정에서 이재명 대통령과 로렌스 웡 싱가포르 총리는 정상회담을 통해 양국의 협력 분야를 확대하기로 합의했다. 특히 AI, 수소, 회자재 및 방산 분야에서의 협력을 강화하기로 하였으며, 제주산 쇠고기 수출 등 경제 협력도 논의되었다.",
        result:
          "결국 양국은 전략적 동반자 관계를 공식적으로 수립하고, 다양한 분야에서 협력을 강화하기로 하였다. 이는 양국의 외교 관계를 한층 격상시키는 계기가 되었다.",
        impact:
          "이번 협력 강화는 한국과 싱가포르 간의 경제 및 안보 협력의 중요성을 알게 했다. 이는 향후 양국 간 지속 가능한 발전을 위한 협력 모델을 제시하고, 다른 동남아 국가들과의 협력에도 긍정적인 영향을 미칠 수 있음을 시사한다.",
      };

      if (!abort) {
        setData(resp);
        setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, [articleId]);

  const goPrev = () => {
    nav("/nie/session/N/step/002", {
      state: { articleId: aId, articleUrl: aUrl, startTime, courseId, sessionId },
    });
  };

  const goNext = async () => {
    // 로딩 중이면 막기
    if (loading) return;

    // 필수 값 없으면 일단 네비게이션만
    if (!courseId || !sessionId || !stepId) {
      console.warn("StepN003: courseId/sessionId/stepId 없음 → API 없이 이동만");
      nav("/nie/session/N/step/004", {
        state: { articleId: aId, articleUrl: aUrl, startTime, courseId, sessionId },
      });
      return;
    }

    try {
      // ⏱️ 얼마나 읽었는지 정도는 보낼 수 있음 (노션 userAnswer 스펙에 맞게 조정 가능)
      const userAnswer = {
        viewed: true,
        timeSpentMs: startTime ? Date.now() - startTime : undefined,
        // 만약 이슈 내용 전체를 같이 보내고 싶으면:
        // issueData: data,
      };

      await submitStepAnswer({
        courseId,
        sessionId,
        stepId,
        contentType: "ISSUE_LEARNING", // ⚠️ 실제 백엔드 contentType 이름이랑 맞춰야 함
        userAnswer,
      });
    } catch (e) {
      console.error("🔥 StepN003 답안 저장 실패:", e);
      // TODO: 필요하면 토스트/알림 넣기
    }

    // 👉 다음 스텝으로 이동
    nav("/nie/session/N/step/004", {
      state: { articleId: aId, articleUrl: aUrl, startTime, courseId, sessionId },
    });
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "42%" }} />
        </div>

        <h2 className={styles.heading}>시사 학습</h2>

        <section className={styles.tableSection} aria-busy={loading}>
          {loading || !data ? (
            <div className={styles.skel}>불러오는 중…</div>
          ) : (
            <div className={styles.issueTable}>
              <div className={styles.row}>
                <div className={styles.cellLabel}>이슈명</div>
                <div className={styles.cellContent}>{data.issue}</div>
              </div>
              <div className={styles.row}>
                <div className={styles.cellLabel}>원인</div>
                <div className={styles.cellContent}>{data.cause}</div>
              </div>
              <div className={styles.row}>
                <div className={styles.cellLabel}>상황</div>
                <div className={styles.cellContent}>{data.situation}</div>
              </div>
              <div className={styles.row}>
                <div className={styles.cellLabel}>결과</div>
                <div className={styles.cellContent}>{data.result}</div>
              </div>
              <div className={styles.row}>
                <div className={styles.cellLabel}>영향</div>
                <div className={styles.cellContent}>{data.impact}</div>
              </div>
            </div>
          )}
        </section>

        <div className={styles.bottomSpace} />
      </div>

      <EduBottomBar
        onPrev={goPrev}
        onNext={goNext}
        onQuit={() => nav("/learn")}
        disablePrev={false}
        disableNext={loading}
      />
    </div>
  );
}

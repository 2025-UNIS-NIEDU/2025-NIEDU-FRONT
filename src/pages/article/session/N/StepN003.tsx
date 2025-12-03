// src/pages/article/session/N/StepN003.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { submitStepAnswer } from "@/lib/apiClient";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN003.module.css";

// 🔹 mock JSON (economy 패키지)에서 시사학습 데이터 읽어오기
import economyPackage from "@/data/economy_2025-11-24_package.json";

type Props = { articleId?: string; articleUrl?: string };

type IssueData = {
  issue: string;
  cause: string;
  circumstance: string;
  result: string;
  effect: string;
};

// ⭐ StepN002 → 넘어오는 state 타입
type RouteState = {
  articleId?: string;
  articleUrl?: string;
  startTime?: number;
  courseId?: string;
  sessionId?: string;
  stepId?: number; // 백엔드 stepId (예: 3)
  level?: "N" | "E" | "I";
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

  // -------------------------------------------------------------------
  // 🔹 mock JSON(economy_2025-11-24_package.json)에서 CURRENT_AFFAIRS 읽기
  //    courses[0].sessions[0].quizzes[level="N"].steps[stepOrder=3].contents[0]
  // -------------------------------------------------------------------
  useEffect(() => {
    setLoading(true);

    try {
      const pkg: any = economyPackage;

      // 일단 첫 번째 코스/세션 기준 (courseId/sessionId 로 세밀 매칭은 나중에)
      const course =
        pkg.courses?.find(
          (c: any) =>
            String(c.courseId) === String(courseId ?? aId ?? 1)
        ) ?? pkg.courses?.[0];

      const session =
        course?.sessions?.find(
          (s: any) => String(s.sessionId) === String(sessionId ?? 1)
        ) ?? course?.sessions?.[0];

      const quizN = session?.quizzes?.find((q: any) => q.level === "N");
      const step3 = quizN?.steps?.find((s: any) => s.stepOrder === 3);
      const content = step3?.contents?.[0];

      if (content) {
        setData({
          issue: content.issue,
          cause: content.cause,
          circumstance: content.circumstance,
          result: content.result,
          effect: content.effect,
        });
      } else {
        console.warn("[StepN003] CURRENT_AFFAIRS content 를 찾지 못했어요.", {
          course,
          session,
          quizN,
          step3,
        });
      }
    } catch (err) {
      console.error("[StepN003] mock 데이터 파싱 실패", err);
    } finally {
      setLoading(false);
    }
  }, [aId, courseId, sessionId]);

  // ==========================================
  // 이전 스텝 (N002)
  // ==========================================
  const goPrev = () => {
    nav("/nie/session/N/step/002", {
      state: {
        articleId: aId,
        articleUrl: aUrl,
        startTime,
        courseId,
        sessionId,
        level: "N", // ✅ level 함께 전달
      },
    });
  };

  // ==========================================
  // 다음 스텝 (N004) + ANSWER API
  // ==========================================
  const goNext = async () => {
    if (loading) return;

    // 필수 값 없으면 API 생략하고 이동만
    if (!courseId || !sessionId || !stepId) {
      console.warn(
        "StepN003: courseId/sessionId/stepId 없음 → API 없이 이동만"
      );
      nav("/nie/session/N/step/004", {
        state: {
          articleId: aId,
          articleUrl: aUrl,
          startTime,
          courseId,
          sessionId,
          level: "N",
        },
      });
      return;
    }

    try {
      const userAnswer = {
        viewed: true,
        timeSpentMs: startTime ? Date.now() - startTime : undefined,
      };

      await submitStepAnswer({
        courseId: String(courseId),
        sessionId: String(sessionId),
        stepId,
        contentType: "CURRENT_AFFAIRS", // ✅ JSON의 contentType 과 맞춤
        userAnswer,
      });
    } catch (e) {
      console.error("🔥 StepN003 답안 저장 실패:", e);
    }

    nav("/nie/session/N/step/004", {
      state: {
        articleId: aId,
        articleUrl: aUrl,
        startTime,
        courseId,
        sessionId,
        level: "N",
      },
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
                <div className={styles.cellContent}>
                  {data.circumstance}
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.cellLabel}>결과</div>
                <div className={styles.cellContent}>{data.result}</div>
              </div>
              <div className={styles.row}>
                <div className={styles.cellLabel}>영향</div>
                <div className={styles.cellContent}>{data.effect}</div>
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

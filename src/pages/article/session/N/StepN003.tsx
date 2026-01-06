import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN003.module.css";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

type Props = { articleId?: string; articleUrl?: string };

type IssueData = {
  issue: string;
  cause: string;
  circumstance: string;
  result: string;
  effect: string;
};

type StepMeta = {
  stepId: number;
  stepOrder: number;
  isCompleted: boolean;
  contentType: string;
  content: any;
  userAnswer: any;
};

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  startTime?: number;
  courseId?: number | string;
  sessionId?: number | string;
  level?: "N" | "E" | "I";
  steps?: StepMeta[];
};

export default function StepN003({ articleId, articleUrl }: Props) {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState) || {};

  const aId = state.articleId ?? articleId;
  const aUrl = state.articleUrl ?? articleUrl;
  const startTime = state.startTime;

  const courseId = state.courseId;
  const sessionId = state.sessionId;
  const steps = state.steps ?? [];

  const STEP_ORDER = 3;
  const CONTENT_TYPE = "CURRENT_AFFAIRS";

  // ✅ start 응답 steps에서 stepOrder=3 찾기
  const currentStep = useMemo(() => {
    return steps.find(
      (s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE
    );
  }, [steps]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IssueData | null>(null);
  const [submitErr, setSubmitErr] = useState("");

  // ✅ currentStep.content에서 표 데이터 파싱
  useEffect(() => {
    setLoading(true);
    setSubmitErr("");

    try {
      const first = currentStep?.content?.contents?.[0];

      if (currentStep && first) {
        setData({
          issue: String(first?.issue ?? ""),
          cause: String(first?.cause ?? ""),
          circumstance: String(first?.circumstance ?? ""),
          result: String(first?.result ?? ""),
          effect: String(first?.effect ?? ""),
        });
      } else {
        console.warn("[StepN003] CURRENT_AFFAIRS contents not found", {
          currentStep,
          stepsLen: steps.length,
        });
        setData(null);
      }
    } catch (err) {
      console.error("[StepN003] parse failed", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [currentStep, steps.length]);

  // ✅ answer 저장 (StepN003는 “조회 완료” 성격이라 간단히 viewed만)
  const submitViewed = async () => {
    setSubmitErr("");

    const cid = Number(courseId ?? aId);
    const sid = Number(sessionId);
    const stepId = Number(currentStep?.stepId);

    if (!cid || Number.isNaN(cid) || !sid || Number.isNaN(sid) || !stepId) {
      // 필수값 없으면 그냥 이동은 되게
      console.warn("[StepN003] missing courseId/sessionId/stepId -> skip submit");
      return true;
    }

    const userAnswer = {
      viewed: true,
      timeSpentMs: startTime ? Date.now() - startTime : undefined,
    };

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
      console.error("[StepN003] submit failed:", e);
      setSubmitErr("저장에 실패했어요. 네트워크/로그인 상태를 확인해주세요.");
      // 저장 실패해도 UX상 다음으로 넘기고 싶으면 true로 바꿔도 됨
      return false;
    }
  };

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
        level: "N",
        steps,
      },
    });
  };

  // ==========================================
  // 다음 스텝 (N004) + ANSWER API
  // ==========================================
  const goNext = async () => {
    if (loading) return;

    const ok = await submitViewed();
    if (!ok) return; // 저장 실패 시 막고 싶으면 유지, 막기 싫으면 이 줄 삭제

    nav("/nie/session/N/step/004", {
      state: {
        articleId: aId,
        articleUrl: aUrl,
        startTime,
        courseId,
        sessionId,
        level: "N",
        steps,
      },
    });
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.progressWrap}>
          {/* 기존 하드코딩 42% 대신 stepOrder 기반으로 계산하고 싶으면 바꿀 수 있음 */}
          <div className={styles.progress} style={{ width: "42%" }} />
        </div>

        <h2 className={styles.heading}>시사 학습</h2>

        {/* 저장 실패 메시지 */}
        {submitErr && <div className={styles.skel}>{submitErr}</div>}

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
                <div className={styles.cellContent}>{data.circumstance}</div>
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

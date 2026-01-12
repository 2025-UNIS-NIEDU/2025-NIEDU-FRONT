import { useLocation, useParams } from "react-router-dom";

import StepN001 from "./N/StepN001";
import StepN002 from "./N/StepN002";
import StepN003 from "./N/StepN003";
import StepN004 from "./N/StepN004";
import StepN005 from "./N/StepN005";

import StepI001 from "./I/StepI001";
import StepI002 from "./I/StepI002";
import StepI003 from "./I/StepI003";
import StepI004 from "./I/StepI004";

import StepE001 from "./E/StepE001";
import StepE002 from "./E/StepE002";
import StepE003 from "./E/StepE003";
import StepE004 from "./E/StepE004";

import type { StepMeta } from "@/pages/article/ArticlePrepare";

type LocState = {
  articleId?: string;
  articleUrl?: string;
  courseId?: number | string;
  sessionId?: number | string | null;
  level?: "N" | "E" | "I";
  steps?: StepMeta[];
  progress?: number;
  startTime?: number;
  entryStepId?: number;
};

type Level = "N" | "E" | "I";

export default function StepRunner() {
  const { level: levelParam, stepId: stepIdParam } = useParams<{
    level?: string;
    stepId?: string;
  }>();

  const location = useLocation();
  const state = (location.state as LocState | undefined) ?? {};

  // level 결정
  const rawLevel = (state.level ?? levelParam ?? "")
    .toString()
    .toUpperCase();

  const lev = rawLevel as Level;

  // step
  const stepIdStr = (stepIdParam ?? "").toString(); // "1"
  const stepOrder = Number(stepIdStr); // 1~5

  // ✅ steps 복구: state -> sessionStorage
  let steps: StepMeta[] = Array.isArray(state.steps) ? state.steps : [];

  const courseIdNum = Number(state.courseId ?? 0);
  const sessionIdNum = Number(state.sessionId ?? 0);

  if (!steps.length && courseIdNum && sessionIdNum && (lev === "N" || lev === "I" || lev === "E")) {
    const storageKey = `niedu_session_${courseIdNum}_${sessionIdNum}_${lev}`;
    const cached = sessionStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.steps)) steps = parsed.steps;
      } catch (e) {
        console.warn("[StepRunner] failed to parse cached session:", e);
      }
    }
  }

  console.log("[StepRunner]", {
    pathname: location.pathname,
    lev,
    stepIdStr,
    stepOrder,
    hasSteps: steps.length,
    state,
  });

  if (!steps.length) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>세션 데이터가 없어요.</div>
        <div style={{ opacity: 0.8, lineHeight: 1.5 }}>
          이 화면은 ArticlePrepare에서 start API 호출 후 전달되는 <code>steps</code>가 필요합니다.
          <br />
          학습 시작 버튼을 통해 진입해주세요. (또는 courseId/sessionId/state 유실 여부 확인)
        </div>
      </div>
    );
  }

  if (!stepIdStr || Number.isNaN(stepOrder) || stepOrder <= 0) {
    return (
      <div style={{ padding: 16 }}>
        잘못된 step 경로입니다. (step: {stepIdStr || "?"})
      </div>
    );
  }

  // N
  if (lev === "N") {
    if (stepOrder === 1) return <StepN001 />;
    if (stepOrder === 2) return <StepN002 />;
    if (stepOrder === 3) return <StepN003 />;
    if (stepOrder === 4) return <StepN004 />;
    if (stepOrder === 5) return <StepN005 />;
  }

  // I
  if (lev === "I") {
    if (stepOrder === 1) return <StepI001 />;
    if (stepOrder === 2) return <StepI002 />;
    if (stepOrder === 3) return <StepI003 />;
    if (stepOrder === 4) return <StepI004 />;
  }

  // E
  if (lev === "E") {
    if (stepOrder === 1) return <StepE001 />;
    if (stepOrder === 2) return <StepE002 />;
    if (stepOrder === 3) return <StepE003 />;
    if (stepOrder === 4) return <StepE004 />;
  }

  return (
    <div style={{ padding: 16 }}>
      준비 중인 단계입니다. (level: {rawLevel || "?"}, stepId: {stepIdStr})
    </div>
  );
}

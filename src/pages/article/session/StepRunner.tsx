// src/pages/article/session/StepRunner.tsx
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

// ArticlePrepare에서 넘어오는 state
type LocState = {
  articleId?: string;
  articleUrl?: string;
  courseId?: string;
  sessionId?: number | null;
  level?: "N" | "E" | "I";
  steps?: StepMeta[];
  progress?: number;
};

type Level = "N" | "E" | "I";

export default function StepRunner() {
  // URL: /nie/session/:level/step/:stepId  라우트 기준
  const { level: levelParam, stepId: stepIdParam } = useParams<{
    level?: string;
    stepId?: string;
  }>();

  const location = useLocation();
  const state = (location.state as LocState | undefined) ?? {};

  // 🔹 URL 경로에서 level 한 번 더 뽑기 (백업용)
  // 예: /nie/session/I/step/004 → ["", "nie", "session", "I", "step", "004"]
  const segments = location.pathname.split("/");
  const levelFromPath = segments[3]; // "I" / "N" / "E" 예상 위치

  // 🔹 N / E / I 결정 (state > useParams > pathname 순)
  const rawLevel = (
    state.level ??
    levelParam ??
    levelFromPath ??
    ""
  )
    .toString()
    .toUpperCase();

  const lev = rawLevel as Level; // 비교할 때만 쓰고, 잘못된 값이면 if 조건에 안 걸림

  const steps = state.steps ?? [];

  const stepIdStr = stepIdParam ?? ""; // "1" 또는 "001"
  const numericStepId = Number(stepIdStr);

  const currentStep =
    steps.length && !Number.isNaN(numericStepId)
      ? steps.find((s) => s.stepId === numericStepId)
      : undefined;

  const sessionIdStr =
    state.sessionId != null ? String(state.sessionId) : undefined;

  console.log("[StepRunner]", {
    pathname: location.pathname,
    lev,
    stepIdStr,
    numericStepId,
    hasSteps: steps.length,
    currentStep,
    state,
  });

  // -------------------- N 단계 --------------------

  if (lev === "N" && (stepIdStr === "001" || stepIdStr === "1")) {
    return (
      <StepN001
        articleId={state.articleId}
        articleUrl={state.articleUrl}
        courseId={state.courseId ?? state.articleId}
        sessionId={sessionIdStr}
        // stepMeta={currentStep}
      />
    );
  }

  if (lev === "N" && (stepIdStr === "002" || stepIdStr === "2")) {
    return <StepN002 />;
  }
  if (lev === "N" && (stepIdStr === "003" || stepIdStr === "3")) {
    return <StepN003 />;
  }
  if (lev === "N" && (stepIdStr === "004" || stepIdStr === "4")) {
    return <StepN004 />;
  }
  if (lev === "N" && (stepIdStr === "005" || stepIdStr === "5")) {
    return <StepN005 />;
  }

  // -------------------- I 단계 --------------------

  if (lev === "I" && (stepIdStr === "001" || stepIdStr === "1")) {
    return (
      <StepI001
        articleId={state.articleId}
        articleUrl={state.articleUrl}
        stepMeta={undefined}
      />
    );
  }

  if (lev === "I" && (stepIdStr === "002" || stepIdStr === "2")) {
    return (
      <StepI002
        articleId={state.articleId}
        articleUrl={state.articleUrl}
        stepMeta={undefined}
      />
    );
  }

  if (lev === "I" && (stepIdStr === "003" || stepIdStr === "3")) {
    return (
      <StepI003
        articleId={state.articleId}
        articleUrl={state.articleUrl}
      />
    );
  }

  if (lev === "I" && (stepIdStr === "004" || stepIdStr === "4")) {
    return (
      <StepI004
        articleId={state.articleId}
        articleUrl={state.articleUrl}
      />
    );
  }

  // -------------------- E 단계 --------------------

  if (lev === "E" && (stepIdStr === "001" || stepIdStr === "1")) {
    return (
      <StepE001
        articleId={state.articleId}
        articleUrl={state.articleUrl}
      />
    );
  }

  if (lev === "E" && (stepIdStr === "002" || stepIdStr === "2")) {
    return (
      <StepE002
        articleId={state.articleId}
        articleUrl={state.articleUrl}
      />
    );
  }

  if (lev === "E" && (stepIdStr === "003" || stepIdStr === "3")) {
    return (
      <StepE003
        articleId={state.articleId}
        articleUrl={state.articleUrl}
      />
    );
  }

  if (lev === "E" && (stepIdStr === "004" || stepIdStr === "4")) {
    return (
      <StepE004
        articleId={state.articleId}
        articleUrl={state.articleUrl}
      />
    );
  }

  // -------------------- fallback --------------------

  return (
    <div style={{ padding: 16 }}>
      준비 중인 단계입니다. (level: {rawLevel || "?"}, stepId: {stepIdStr})
    </div>
  );
}

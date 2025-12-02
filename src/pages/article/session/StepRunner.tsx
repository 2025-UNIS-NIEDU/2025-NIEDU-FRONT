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

// E 단계
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
  sessionId?: string;
  level?: "N" | "E" | "I";
  steps?: StepMeta[];
  progress?: number;
};

export default function StepRunner() {
  const { level, sessionId, stepId } = useParams<{
    level?: string;
    sessionId?: string;
    stepId?: string;
  }>();
  const { state } = useLocation() as { state?: LocState };

  const lev = (
    state?.level ?? level ?? sessionId ?? ""
  ).toUpperCase() as "N" | "E" | "I";

  const steps = state?.steps ?? [];
  const stepIdStr = stepId ?? "";
  const numericStepId = Number(stepIdStr); // "1" or "001" -> 1

  const currentStep =
    steps.length && !Number.isNaN(numericStepId)
      ? steps.find((s) => s.stepId === numericStepId)
      : undefined;

  console.log("[StepRunner]", {
    lev,
    stepId,
    numericStepId,
    hasSteps: steps.length,
    currentStep,
    state,
  });

  // -------------------- N 단계 --------------------

  if (lev === "N" && (stepIdStr === "001" || stepIdStr === "1")) {
    return (
      <StepN001
        articleId={state?.articleId}
        articleUrl={state?.articleUrl}
        courseId={state?.courseId ?? state?.articleId}
        sessionId={state?.sessionId}
        stepMeta={currentStep}
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
        articleId={state?.articleId}
        articleUrl={state?.articleUrl}
      />
    );
  }
  if (lev === "I" && (stepIdStr === "002" || stepIdStr === "2")) {
    return (
      <StepI002
        articleId={state?.articleId}
        articleUrl={state?.articleUrl}
      />
    );
  }
  if (lev === "I" && (stepIdStr === "003" || stepIdStr === "3")) {
    return (
      <StepI003
        articleId={state?.articleId}
        articleUrl={state?.articleUrl}
      />
    );
  }
  if (lev === "I" && (stepIdStr === "004" || stepIdStr === "4")) {
    return (
      <StepI004
        articleId={state?.articleId}
        articleUrl={state?.articleUrl}
      />
    );
  }

  // -------------------- E 단계 --------------------

  if (lev === "E" && (stepIdStr === "001" || stepIdStr === "1")) {
    return (
      <StepE001
        articleId={state?.articleId}
        articleUrl={state?.articleUrl}
      />
    );
  }

  if (lev === "E" && (stepIdStr === "002" || stepIdStr === "2")) {
    return (
      <StepE002
        articleId={state?.articleId}
        articleUrl={state?.articleUrl}
      />
    );
  }

  if (lev === "E" && (stepIdStr === "003" || stepIdStr === "3")) {
    return (
      <StepE003
        articleId={state?.articleId}
        articleUrl={state?.articleUrl}
      />
    );
  }

  if (lev === "E" && (stepIdStr === "004" || stepIdStr === "4")) {
    return (
      <StepE004
        articleId={state?.articleId}
        articleUrl={state?.articleUrl}
      />
    );
  }

  // -------------------- fallback --------------------

  return (
    <div style={{ padding: 16 }}>
      준비 중인 단계입니다. (level: {lev}, stepId: {stepId})
    </div>
  );
}

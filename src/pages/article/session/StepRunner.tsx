// src/pages/article/session/StepRunner.tsx
import { useLocation, useParams, Navigate } from "react-router-dom";

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
};

type Level = "N" | "E" | "I";

export default function StepRunner() {
  const { level: levelParam, stepId: stepIdParam } = useParams<{
    level?: string;
    stepId?: string;
  }>();

  const location = useLocation();
  const state = (location.state as LocState | undefined) ?? {};

  // URL에서 level fallback
  const segments = location.pathname.split("/");
  const levelFromPath = segments[3];

  const rawLevel = (state.level ?? levelParam ?? levelFromPath ?? "")
    .toString()
    .toUpperCase();

  const lev = rawLevel as Level;

  const stepIdStr = (stepIdParam ?? "").toString(); // "001" | "1"
  const stepOrder = Number(stepIdStr); // 1~5

  const steps = state.steps ?? [];
  const currentStep =
    steps.length && !Number.isNaN(stepOrder)
      ? steps.find((s) => Number(s.stepOrder) === stepOrder)
      : undefined;

  // 디버그 (필요 없으면 지워도 됨)
  console.log("[StepRunner]", {
    pathname: location.pathname,
    lev,
    stepIdStr,
    stepOrder,
    hasSteps: steps.length,
    currentStep,
    state,
  });

  // ✅ 핵심: steps가 없으면 Step들이 content를 못 그리니까 안내
  // (사용자가 직접 /nie/session/N/step/001 URL로 들어왔을 때 흔함)
  if (!steps.length) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          세션 데이터가 없어요.
        </div>
        <div style={{ opacity: 0.8, lineHeight: 1.5 }}>
          이 화면은 ArticlePrepare에서 start API 호출 후 전달되는 <code>steps</code>가
          필요합니다.
          <br />
          학습 시작 버튼을 통해 진입해주세요.
        </div>
      </div>
    );
  }

  // -------------------- N 단계 --------------------
  if (lev === "N") {
    if (stepOrder === 1) return <StepN001 />;
    if (stepOrder === 2) return <StepN002 />;
    if (stepOrder === 3) return <StepN003 />;
    if (stepOrder === 4) return <StepN004 />;
    if (stepOrder === 5) return <StepN005 />;
  }

  // -------------------- I 단계 --------------------
  if (lev === "I") {
    if (stepOrder === 1) return <StepI001 />;
    if (stepOrder === 2) return <StepI002 />;
    if (stepOrder === 3) return <StepI003 />;
    if (stepOrder === 4) return <StepI004 />;
  }

  // -------------------- E 단계 --------------------
  if (lev === "E") {
    if (stepOrder === 1) return <StepE001 />;
    if (stepOrder === 2) return <StepE002 />;
    if (stepOrder === 3) return <StepE003 />;
    if (stepOrder === 4) return <StepE004 />;
  }

  // -------------------- fallback --------------------
  return (
    <div style={{ padding: 16 }}>
      준비 중인 단계입니다. (level: {rawLevel || "?"}, stepId: {stepIdStr})
    </div>
  );
}

// src/lib/apiClient.ts
// 공용 API 헬퍼 (mock 제거)

import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

export type LevelCode = "N" | "E" | "I";

export type StartSessionPayload = {
  courseId: number;
  sessionId: number;
  level: LevelCode;
};

export type StartSessionResponse = ApiResponse<{
  entryStepId: number;
  steps: any[];
  progress?: number;
}>;

export async function startSession(payload: StartSessionPayload) {
  const res = await api.post<StartSessionResponse>(
    `/api/edu/courses/${payload.courseId}/sessions/${payload.sessionId}/start`,
    { level: payload.level }
  );
  return res.data;
}

export async function submitStepAnswer(args: {
  courseId: number;
  sessionId: number;
  stepId: number;
  contentType: string;
  userAnswer: unknown;
}) {
  // 서버가 기대하는 포맷은 StepN 계열과 동일하게 통일
  return api.post<ApiResponse<null>>(
    `/api/edu/courses/${args.courseId}/sessions/${args.sessionId}/steps/${args.stepId}/answer`,
    {
      contentType: args.contentType,
      userAnswer: args.userAnswer,
    }
  );
}

export async function submitForFeedback(args: {
  courseId: number;
  sessionId: number;
  stepId: number;
  contentId: number;
  userAnswer: string;
}) {
  const res = await api.post<
    ApiResponse<{ contentId: number; AIScore: number; AIFeedback: string }>
  >(
    `/api/edu/courses/${args.courseId}/sessions/${args.sessionId}/steps/${args.stepId}/submit-for-feedback`,
    { contentId: args.contentId, userAnswer: args.userAnswer }
  );
  return res.data;
}

export async function getSessionSummary(args: {
  courseId: number;
  sessionId: number;
}) {
  const res = await api.get<ApiResponse<{ streak: number; learningTime: any }>>(
    `/api/edu/courses/${args.courseId}/sessions/${args.sessionId}/summary`
  );
  return res.data;
}

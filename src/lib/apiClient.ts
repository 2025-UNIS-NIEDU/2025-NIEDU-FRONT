// src/lib/apiClient.ts
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
  // ✅ 서버가 answers 래핑 형태를 기대하는 경우가 많아서 프론트에서 정규화
  const normalizeUserAnswer = (contentType: string, ua: unknown) => {
    if (ua == null) return null;

    // 이미 { answers: [...] } 형태면 그대로
    if (typeof ua === "object" && ua !== null && "answers" in (ua as any)) return ua;

    // 배열이면 { answers: [...] }로 래핑
    if (Array.isArray(ua)) {
      // SENTENCE_COMPLETION은 value 대신 userAnswer 키를 요구하는 케이스가 있어서 방어
      if (contentType === "SENTENCE_COMPLETION") {
        return {
          answers: ua.map((a: any) => ({
            contentId: a?.contentId,
            userAnswer: a?.userAnswer ?? a?.value ?? "",
            ...(a?.AIScore != null ? { AIScore: a.AIScore } : {}),
            ...(a?.AIFeedback != null ? { AIFeedback: a.AIFeedback } : {}),
          })),
        };
      }
      return { answers: ua };
    }

    // 단일 오브젝트면 answers 1개짜리로 래핑(방어)
    return { answers: [ua] };
  };

  return api.post<ApiResponse<null>>(
    `/api/edu/courses/${args.courseId}/sessions/${args.sessionId}/steps/${args.stepId}/answer`,
    {
      contentType: args.contentType,
      userAnswer: normalizeUserAnswer(args.contentType, args.userAnswer),
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

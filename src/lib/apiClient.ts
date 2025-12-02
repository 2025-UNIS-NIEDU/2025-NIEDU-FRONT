// src/lib/apiClient.ts
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// 로컬에서는 Vite proxy(/api -> 백엔드) 쓰고,
// 배포 환경에서는 BE 도메인으로 직접 호출
const API_ORIGIN = isLocalhost ? "" : "https://api.niedu-service.com";

export const BASE_URL = API_ORIGIN; // 필요하면 다른 파일에서 써도 되니까 남겨둠

type ApiOptions = RequestInit & {
  skipAuthRetry?: boolean;
};

/**
 * STEP 답안 저장 API
 * POST /api/edu/courses/{courseId}/sessions/{sessionId}/steps/{stepId}/answer
 */
export async function submitStepAnswer(params: {
  courseId: string;
  sessionId: string;
  stepId: number;
  contentType: string;
  userAnswer: any; // contentType별 JSON 구조 (노션 userAnswer 표 참고)
}) {
  const { courseId, sessionId, stepId, contentType, userAnswer } = params;

  const url = `${API_ORIGIN}/api/edu/courses/${courseId}/sessions/${sessionId}/steps/${stepId}/answer`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      contentType,
      userAnswer,
    }),
  });

  // 500 같은 경우 HTML이 올 수도 있어서, 일단 text로 받아보고 JSON 파싱 시도
  const text = await res.text();

  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`답안 저장 중 서버 응답이 JSON이 아닙니다. (status: ${res.status})`);
  }

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || "답안 저장 중 오류가 발생했어요.");
  }

  return json;
}

/**
 * 공통 fetch 래퍼
 * path는 항상 "/api/..." 형태로 전달한다고 가정
 */
export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const url = `${API_ORIGIN}${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  const text = await res.text();

  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `API 응답이 JSON이 아닙니다. (url: ${path}, status: ${res.status})`
    );
  }

  // 우리 백엔드 공통 응답 포맷 { success, status, message, data } 기준
  if (!res.ok || json?.success === false) {
    const msg =
      json?.message || `API 호출 실패 (url: ${path}, status: ${res.status})`;
    const error: any = new Error(msg);
    error.status = json?.status ?? res.status;
    throw error;
  }

  return json as T;
}

// src/lib/apiClient.ts

const USE_MOCK_API = true;  // 🔹 지금은 백엔드 안 쓸 거니까 true 로 고정

// 타입은 기존 파일 그대로 사용
export type StartSessionPayload = {
  courseId: string;
  sessionId: string;
  level: "N" | "E" | "I";
};

export type StartSessionResponse = {
  success: boolean;
  status: number;
  message: string;
  data: {
    entryStepId: number;
    steps: any[];   // 실제로는 StepMeta[]
  };
};

// ✅ 세션 시작: 지금은 그냥 mock 데이터 리턴만 하고, 네트워크 호출 안 함
export async function startSession(
  payload: StartSessionPayload
): Promise<StartSessionResponse> {
  if (USE_MOCK_API) {
    console.info("[startSession] MOCK MODE, 실제 API 호출하지 않음", payload);

    // StepRunner가 최소한으로 필요한 값만 줘도 됨
    return {
      success: true,
      status: 200,
      message: "mock",
      data: {
        entryStepId: 1,
        steps: [],      // 이미 N/E/I 스텝에서 JSON을 직접 읽고 있으니 비워둬도 됨
      },
    };
  }

  // 🔻 나중에 진짜 백엔드 쓸 때 다시 살릴 부분
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/api/edu/courses/${payload.courseId}/sessions/${payload.sessionId}/start`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ level: payload.level }),
    }
  );
  const json = await res.json();
  return json;
}

// ✅ 답안 전송도 지금은 no-op
export async function submitStepAnswer(_: {
  courseId: string;
  sessionId: string;
  stepId: number;
  contentType: string;
  userAnswer: unknown;
}) {
  if (USE_MOCK_API) {
    console.info("[submitStepAnswer] MOCK MODE, 실제 API 호출하지 않음");
    return;
  }

  // 나중용 실제 API 코드 ...
}

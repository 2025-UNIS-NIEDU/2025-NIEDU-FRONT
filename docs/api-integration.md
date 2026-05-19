# API Integration

## Axios Instance

공통 Axios 인스턴스는 `src/api/axiosInstance.ts`에서 생성합니다.

```ts
const api = axios.create({
  baseURL: import.meta.env.VITaE_API_BASE_URL || "https://api.niedu-service.com",
  withCredentials: true,
});
```

`withCredentials: true` 설정으로 쿠키 기반 인증 요청을 보냅니다. 홈 화면은 이 인스턴스를 사용해 사용자 정보, 출석 스트릭, 오늘의 뉴스 API를 호출합니다.

## Authorization Header

요청 interceptor는 로컬 개발 환경에서만 Zustand auth store의 `accessToken`을 Authorization 헤더에 추가합니다.

- 대상 환경: `localhost`, `127.0.0.1`
- token source: `useAuthStore.getState().accessToken`
- header format: `Bearer ${accessToken}`

운영 환경에서는 쿠키 인증을 기준으로 동작하도록 설계되어 있습니다.

## Token Reissue

응답 interceptor는 401 응답을 받으면 원 요청에 `_retry` flag를 설정하고 `/api/auth/reissue-access-token`로 재발급 요청을 보냅니다.

재발급 요청은 별도 `axios.post`로 수행하며 `withCredentials: true`를 유지합니다. 재발급에 성공하면 원래 요청을 다시 실행하고, 실패하면 `authStore.logout()`을 호출합니다.

## Kakao OAuth

Kakao OAuth 진입은 `src/pages/onboarding/OnboardingIntro3.tsx`에서 처리합니다.

```ts
window.location.href = "https://api.niedu-service.com/oauth2/authorization/kakao";
```

로그인 성공 후 `/login/success`로 돌아오면 `src/pages/LoginSuccess.tsx`가 query parameter의 `accessToken`, `refreshToken`, `withdrawPending` 값을 읽습니다. 로컬 환경에서 `accessToken`이 있으면 Zustand auth store에 저장하고, 이후 `/home`으로 replace navigation을 수행합니다.

## Home API Calls

`src/pages/Home/Home.tsx`는 개발 환경에서 다음 API를 호출합니다.

- `GET /api/user/me`
- `GET /api/attendance/streak`
- `GET /api/home/news`

배포 환경에서는 portfolio demo 안정성을 위해 일부 데이터가 mock 값으로 대체됩니다.

## Course Detail And Session List

`src/pages/ArticleDetail/ArticleDetail.tsx`는 현재 `src/lib/mockCourseApi.ts`의 `getCourseDetail(courseId)`를 사용합니다. 이 adapter는 `src/data/economy_2025-11-24_package.json`에서 코스 상세, 진행률, 세션 목록에 필요한 데이터를 매핑합니다.

실제 API로 전환할 때는 ArticleDetail의 데이터 source를 `getCourseDetail` mock adapter에서 Axios 기반 API 함수로 교체하면 됩니다. 화면 state 구조는 이미 `detail`, `sessions`, `loadingDetail`, `loadingSessions`, `errorMsg`로 분리되어 있어 API 연동에 맞춰 확장하기 쉽습니다.

## Start Session

`src/lib/apiClient.ts`에는 학습 세션 시작 API 형태가 준비되어 있습니다.

```ts
POST /api/edu/courses/:courseId/sessions/:sessionId/start
```

요청 body는 `{ level }`이며, `credentials: "include"`로 쿠키를 포함하도록 작성되어 있습니다. 현재는 `USE_MOCK_API = true`라 실제 네트워크 요청 대신 mock `entryStepId`와 빈 `steps`를 반환합니다.

`src/pages/article/ArticlePrepare.tsx`는 현재 start API를 직접 호출하지 않고 선택한 레벨, courseId, sessionId를 `StepRunner` navigation state로 전달합니다.

## Answer Submission

`submitStepAnswer` 함수는 `src/lib/apiClient.ts`에 정의되어 있습니다. 현재 mock mode에서는 no-op이며, N/I/E 단계 컴포넌트 일부에서 courseId, sessionId, stepId가 준비되었을 때 호출할 수 있는 구조를 갖고 있습니다.


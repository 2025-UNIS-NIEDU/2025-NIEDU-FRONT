# Troubleshooting

## README Merge Conflict Markers

기존 README에는 Git merge conflict marker가 남아 있었습니다. 포트폴리오 문서에서는 충돌 흔적을 제거하고 프로젝트 소개, 기술 스택, 주요 기능, 실행 방법 중심으로 재작성했습니다.

## API Base URL

`src/api/axiosInstance.ts`는 `import.meta.env.VITaE_API_BASE_URL`를 참조합니다. Vite 환경 변수는 일반적으로 `VITE_` prefix를 사용하므로, 실제 환경 변수명이 `VITE_API_BASE_URL`이라면 현재 코드에서는 fallback URL인 `https://api.niedu-service.com`이 사용될 수 있습니다.

배포 전 확인 항목:

- `.env` 변수명
- Vercel 또는 배포 플랫폼 환경 변수명
- `vite.config.ts` proxy target
- Axios instance base URL

## Cookie Authentication

인증 요청은 `withCredentials: true`를 사용합니다. 브라우저에서 쿠키가 포함되지 않으면 다음을 확인해야 합니다.

- API 서버 CORS `Access-Control-Allow-Credentials`
- API 서버 CORS origin allowlist
- cookie `SameSite`, `Secure`, domain 설정
- 프론트엔드 요청 URL과 API 서버 origin

## Authorization Header In Local Development

로컬 개발 환경에서는 `useAuthStore`의 `accessToken`이 Authorization 헤더에 들어갑니다. Kakao OAuth callback 이후 query string에 token이 없거나 `LoginSuccess`가 호출되지 않으면 store가 비어 있을 수 있습니다.

확인할 파일:

- `src/pages/LoginSuccess.tsx`
- `src/store/authStore.ts`
- `src/api/axiosInstance.ts`

## Token Reissue

401 응답 시 `/api/auth/reissue-access-token` 요청 후 원 요청을 다시 실행합니다. 재발급 실패 시 `logout()`만 호출하고 별도 로그인 페이지 이동은 TODO로 남아 있습니다.

확인할 항목:

- refresh cookie가 브라우저에 존재하는지
- 재발급 API가 쿠키 기반 요청을 허용하는지
- 재발급 성공 후 원 요청에 필요한 Authorization 헤더 또는 쿠키가 준비되는지

## ArticleDetail Data Source

`ArticleDetail`은 현재 실제 API가 아니라 `mockCourseApi`의 `getCourseDetail`을 사용합니다. 따라서 API 응답 문제를 디버깅할 때는 먼저 mock JSON과 adapter mapping을 확인해야 합니다.

확인할 파일:

- `src/pages/ArticleDetail/ArticleDetail.tsx`
- `src/lib/mockCourseApi.ts`
- `src/data/economy_2025-11-24_package.json`

## Start Session API

`src/lib/apiClient.ts`에는 start API 호출 코드가 있지만 `USE_MOCK_API = true`로 고정되어 있습니다. 실제 API 호출이 필요하다면 해당 flag와 `ArticlePrepare`의 호출 흐름을 함께 정리해야 합니다.

현재 `ArticlePrepare`는 `startSession`을 호출하지 않고 route state로 `StepRunner`에 데이터를 전달합니다.

## StepRunner State Recovery

현재 `StepRunner`는 다음 순서로 학습 단계를 결정합니다.

- `location.state.level`
- route param
- URL path segment

새로고침 후에도 학습 상태를 완전히 복구하려면 `sessionStorage` 또는 store persistence가 필요합니다. 현재 코드에는 `sessionStorage` 저장/복원 로직이 없으므로, 포트폴리오에서 설명할 때는 현재 구현과 개선 예정 항목을 구분해야 합니다.

## PWA Assets

`vite.config.ts` manifest에는 다음 아이콘이 선언되어 있습니다.

- `/icons/maskable-icon-192.png`
- `/icons/maskable-icon-512.png`

`public/icons`에는 192 PNG와 512 SVG가 확인됩니다. manifest에 선언된 512 PNG가 실제로 존재하는지 확인하고, 없으면 아이콘 파일 추가 또는 manifest 경로 수정을 검토해야 합니다.

## Build Check

문서만 수정하더라도 `npm run build`는 기존 TypeScript와 Vite 설정의 영향을 받습니다. 빌드 실패 시 문서 변경 때문인지, 기존 코드의 타입/asset/env 문제인지 분리해서 확인해야 합니다.

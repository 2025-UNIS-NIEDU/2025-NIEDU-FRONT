# NIEdu Frontend Portfolio

## Project Summary

NIEdu Frontend는 뉴스 콘텐츠를 코스와 학습 세션으로 구성해 사용자가 단계별로 학습할 수 있도록 만든 React 기반 PWA입니다. 온보딩, OAuth 로그인, 홈, 코스 상세, 학습 준비, 단계별 학습, 마이페이지 화면을 포함합니다.

## Role

프론트엔드 개발 관점에서 라우팅 구조, 인증 요청 흐름, 상태 관리, 학습 플로우, PWA 설정을 설계하고 구현한 프로젝트로 정리했습니다.

## Main Contributions

- React Router 기반 전체 화면 라우팅 구성
- Kakao OAuth 로그인 진입 및 성공 callback 화면 처리
- Axios 공통 인스턴스 구성과 인증 요청 interceptor 작성
- `withCredentials` 기반 쿠키 인증 요청 설정
- 로컬 개발 환경에서 `accessToken` Authorization 헤더 처리
- 401 응답 발생 시 access token 재발급 요청 후 원 요청 재시도
- Zustand 기반 인증 토큰 및 로그인 상태 관리
- 홈 화면 사용자 정보, 출석 스트릭, 오늘의 뉴스 요청 흐름 구현
- 코스 상세 화면에서 코스 상세와 세션 목록을 하나의 adapter로 조회
- 학습 준비 화면에서 선택한 레벨과 세션 정보를 StepRunner로 전달
- StepRunner에서 URL path, route param, navigation state를 조합해 단계별 학습 컴포넌트 렌더링
- vite-plugin-pwa 기반 service worker 등록 및 manifest 구성

## Portfolio Highlights

### Routing

`src/main.tsx`에서 `BrowserRouter`를 설정하고, `src/router/index.tsx`에서 온보딩, 홈, 학습, 상세, 준비, 세션, 결과, 마이페이지 라우트를 선언합니다.

### Authentication

`src/api/axiosInstance.ts`는 공통 Axios 인스턴스를 생성하고 `withCredentials`를 활성화합니다. 로컬 환경에서는 Zustand auth store의 `accessToken`을 Authorization 헤더에 넣고, 401 응답 시 `/api/auth/reissue-access-token`로 재발급을 시도합니다.

### State Management

`src/store/authStore.ts`는 `accessToken`, `refreshToken`, `isLoggedIn`을 관리합니다. `LoginSuccess` 페이지는 Kakao OAuth callback query에서 token을 읽고 로컬 환경에서 store에 저장한 뒤 `/home`으로 이동합니다.

### Learning Flow

`ArticleDetail`은 선택한 코스의 상세 정보와 세션 목록을 렌더링하고, `useGoToPrepare`를 통해 `ArticlePrepare`로 이동합니다. `ArticlePrepare`는 N/I/E 레벨 선택 후 `StepRunner`로 이동하며, `StepRunner`는 레벨과 step id에 따라 실제 학습 컴포넌트를 분기합니다.

### PWA

`vite.config.ts`에서 `VitePWA` plugin을 설정하고, `src/main.tsx`에서 `virtual:pwa-register`의 `registerSW`를 호출합니다. manifest에는 앱 이름, display mode, theme color, maskable icon, Workbox runtime cache 전략이 포함되어 있습니다.

## Current Implementation Notes

- 코스 목록과 코스 상세는 현재 `src/lib/mockCourseApi.ts`와 `src/data/economy_2025-11-24_package.json` 기반으로 동작합니다.
- `src/lib/apiClient.ts`의 `startSession`은 실제 API endpoint 형태를 보존하고 있지만, `USE_MOCK_API = true` 상태에서는 mock 응답을 반환합니다.
- StepRunner는 현재 `sessionStorage` persistence가 아니라 React Router `location.state`, route param, URL path fallback을 기반으로 학습 단계를 복구합니다.


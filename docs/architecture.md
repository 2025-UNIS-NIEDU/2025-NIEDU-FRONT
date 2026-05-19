# Frontend Architecture

## Overview

NIEdu Frontend는 Vite 기반 React 애플리케이션입니다. 화면 단위는 `src/pages`, 공통 UI는 `src/components`, 라우팅은 `src/router`, API와 상태 관리는 `src/api`, `src/lib`, `src/store`로 분리되어 있습니다.

## Entry Point

`src/main.tsx`에서 React root를 생성하고 다음 구성을 적용합니다.

- `StrictMode`
- `BrowserRouter`
- `AppRouter`
- global stylesheet
- PWA service worker registration

## Routing Structure

라우트 선언은 `src/router/index.tsx`에 모여 있습니다.

| Path | Component | Purpose |
| --- | --- | --- |
| `/` | `OnboardingIntro1` | 첫 온보딩 화면 |
| `/onboarding/2` | `OnboardingIntro2` | 온보딩 2단계 |
| `/onboarding/3` | `OnboardingIntro3` | Kakao 로그인 진입 화면 |
| `/onboarding/4` | `OnboardingIntro4` | 온보딩 4단계 |
| `/onboarding/topic` | `OnboardingTopic` | 관심 주제 선택 |
| `/onboarding/alarm` | `OnboardingAlarm` | 알림 설정 |
| `/home` | `Home` | 홈 대시보드 |
| `/recent-courses` | `RecentCourses` | 최근 학습 코스 |
| `/saved-courses` | `SavedCourses` | 저장한 코스 |
| `/learn` | `Learn` | 학습 코스 목록 |
| `/article/:articleId` | `ArticleDetail` | 코스 상세 |
| `/article/:articleId/prepare` | `ArticlePrepare` | 학습 준비 |
| `/login/success` | `LoginSuccess` | OAuth callback 처리 |
| `/nie/session/:sessionId/step/:stepId` | `StepRunner` | 단계별 학습 실행 |
| `/nie/session/N/result` | `EduResult` | N단계 결과 |
| `/nie/session/I/result` | `EduResult` | I단계 결과 |
| `/mypage` | `MyPage` | 마이페이지 |

## Data Flow

1. 사용자는 온보딩 또는 홈/학습 화면에서 코스를 선택합니다.
2. `useGoToDetail`이 `/article/:articleId`로 이동합니다.
3. `ArticleDetail`은 `getCourseDetail(articleId)`로 상세 정보와 세션 목록을 조회합니다.
4. 사용자가 세션을 선택하면 `useGoToPrepare`가 `/article/:articleId/prepare`로 `sessionId`, `articleTitle` state를 전달합니다.
5. `ArticlePrepare`는 레벨을 선택하고 `/nie/session/:level/step/1`로 이동합니다.
6. `StepRunner`는 URL path, route param, navigation state를 조합해 N/I/E 단계별 컴포넌트를 렌더링합니다.

## State Management

`src/store/authStore.ts`는 Zustand로 인증 상태를 관리합니다.

- `accessToken`
- `refreshToken`
- `isLoggedIn`
- `setTokens`
- `logout`

`src/store/session.store.ts`는 학습 시작/종료 시간과 streak 표시용 상태를 관리하는 store입니다.

## Styling

화면별 CSS Modules를 사용합니다. 예를 들어 `ArticleDetail.tsx`는 `ArticleDetail.module.css`, `Home.tsx`는 `Home.module.css`를 import합니다. 이 방식은 페이지 단위 스타일 충돌을 줄이고 컴포넌트 가까이에 스타일을 배치하는 구조입니다.

## PWA Architecture

PWA 설정은 `vite.config.ts`의 `VitePWA` plugin에서 관리합니다.

- `registerType: "autoUpdate"`
- manifest name, short name, theme/background color
- standalone display mode
- maskable icons
- Workbox runtime caching
- SPA navigation fallback

`src/main.tsx`는 `registerSW({ immediate: true })`를 호출해 service worker를 등록합니다.


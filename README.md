

## Key Features

- React Router 기반 온보딩, 홈, 학습, 코스 상세, 마이페이지 라우팅
- Kakao OAuth 진입 및 로그인 성공 콜백 라우팅
- Axios 공통 인스턴스 기반 API 요청 구성
- `withCredentials` 기반 쿠키 인증 요청
- 로컬 개발 환경에서 `accessToken` Authorization 헤더 주입
- 401 응답 시 access token 재발급 요청 후 원 요청 재시도
- Zustand 기반 인증 토큰 및 로그인 상태 관리
- 홈 화면의 사용자 정보, 출석 스트릭, 오늘의 뉴스 API 요청
- mock course adapter 기반 코스 목록, 코스 상세, 학습 세션 목록 렌더링
- 단계별 학습 화면을 N/I/E 레벨과 step id에 따라 분기
- Vite PWA service worker 등록 및 manifest 설정

## Frontend Architecture

```text
src/
  api/              Axios 공통 인스턴스
  components/       학습 공통 UI 컴포넌트
  data/             mock course/session 데이터
  hooks/            라우팅 helper hook
  lib/              API adapter 및 mock course adapter
  pages/            route 단위 화면
  router/           React Router route table
  store/            Zustand store
  types/            API 타입
```

앱 진입점은 `src/main.tsx`입니다. `BrowserRouter`로 전체 앱을 감싸고 `src/router/index.tsx`의 `AppRouter`에서 주요 화면을 선언합니다.

API 요청은 `src/api/axiosInstance.ts`에서 생성한 Axios 인스턴스를 기준으로 처리합니다. 인증 상태는 `src/store/authStore.ts`의 Zustand store에서 관리합니다.

## My Contributions

- 기존 Vite template README와 깨진 merge conflict 내용을 제거하고 포트폴리오용 README로 재작성
- 프로젝트 구조, 라우팅, 인증 요청, 학습 플로우, PWA 설정을 코드 기준으로 문서화
- React Router route table을 기준으로 사용자 이동 경로 정리
- Axios interceptor, `withCredentials`, token reissue 흐름을 문서화
- Zustand 인증 store와 Kakao OAuth callback 처리 방식 정리
- ArticleDetail, ArticlePrepare, StepRunner의 현재 구현 상태와 API 전환 포인트 정리
- `docs/` 하위에 아키텍처, API 연동, 트러블슈팅, 포트폴리오, 스크린샷 문서 추가

## Troubleshooting

- `README.md`에 merge conflict marker가 남아 있으면 Markdown 렌더링과 포트폴리오 가독성이 떨어집니다. 현재 문서에서는 Git 충돌 marker를 제거했습니다.
- API base URL은 `src/api/axiosInstance.ts`에서 `import.meta.env.VITaE_API_BASE_URL`를 참조합니다. 일반적인 Vite 환경 변수명은 `VITE_*` 형식이므로, 실제 배포 환경에서는 변수명이 의도와 일치하는지 확인해야 합니다.
- `src/lib/apiClient.ts`의 `USE_MOCK_API`가 `true`로 고정되어 있어 `startSession`은 현재 실제 네트워크 요청 대신 mock 응답을 반환합니다.
- `StepRunner`는 현재 `location.state`와 URL path를 기준으로 학습 단계 복구를 시도합니다. 새로고침 후 완전 복구가 필요하면 `sessionStorage` 저장/복원 레이어를 추가하는 것이 좋습니다.
- PWA 아이콘 manifest에는 `maskable-icon-512.png`가 선언되어 있습니다. `public/icons`에 실제 파일이 있는지 배포 전에 확인해야 합니다.

자세한 내용은 [docs/troubleshooting.md](docs/troubleshooting.md)를 참고하세요.

## Run Locally

```bash
npm install
npm run dev
```

개발 서버 기본 포트는 `vite.config.ts` 기준 `5173`입니다.

## Build

```bash
npm run build
```

빌드 스크립트는 TypeScript project build 후 Vite build를 실행합니다.

## Links

- [Portfolio Summary](docs/portfolio.md)
- [Frontend Architecture](docs/architecture.md)
- [API Integration](docs/api-integration.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Screenshots](docs/screenshots.md)

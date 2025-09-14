# 프로젝트명 (Frontend)

## 📌 소개
프로젝트 프론트엔드 레포지토리입니다.  
사용자 UI 및 클라이언트 로직을 담당합니다.

## ⚙️ Tech Stack
- **Language**: TypeScript
- **Framework / Library**: React, React Router, Tailwind CSS, Shadcn UI
- **Build / Tooling**: Vite, ESLint, Prettier
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel

## 📂 프로젝트 구조
src/
 ┣ components/   # 재사용 가능한 컴포넌트
 ┣ pages/        # 페이지 단위 컴포넌트
 ┣ hooks/        # 커스텀 훅
 ┣ services/     # API 통신 (Axios)
 ┣ assets/       # 이미지/폰트 등 정적 리소스
 ┗ main.tsx      # 엔트리 포인트

## 🚀 실행 방법
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

## 📝 기능 목록
- [ ] 회원가입 / 로그인 화면
- [ ] 대화형 UI (SSE 기반 채팅)
- [ ] 사용자 설정 페이지

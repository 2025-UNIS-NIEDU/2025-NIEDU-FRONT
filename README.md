<<<<<<< HEAD
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
=======
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
>>>>>>> 76e18604a8cfa48c47288fb72ae17c9bb1310847

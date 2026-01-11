import { Routes, Route, Navigate } from "react-router-dom";

// ✅ 새 Intro 1~7
import Intro1 from "@/pages/onboarding/intro/Intro1";
import Intro2 from "@/pages/onboarding/intro/Intro2";
import Intro3 from "@/pages/onboarding/intro/Intro3";
import Intro4 from "@/pages/onboarding/intro/Intro4";
import Intro5 from "@/pages/onboarding/intro/Intro5";
import Intro6 from "@/pages/onboarding/intro/Intro6";
import Intro7 from "@/pages/onboarding/intro/Intro7";

// 기존 온보딩 다음 단계
import OnboardingTopic from "@/pages/onboarding/OnboardingTopic";
import OnboardingAlarm from "@/pages/onboarding/OnboardingAlarm";

// 이하 기존 라우트들 그대로
import Home from "@/pages/Home/Home";
import RecentCourses from "@/pages/Home/RecentCourses";
import SavedCourses from "@/pages/Home/SavedCourses";
import Learn from "@/pages/Learn/Learn";
import LearnSearch from "@/pages/Learn/LearnSearch";
import ArticlePrepare from "@/pages/article/ArticlePrepare";
import LoginSuccess from "@/pages/LoginSuccess";
import StepRunner from "@/pages/article/session/StepRunner";
import EduResult from "@/components/edu/EduResult";
import ArticleDetail from "@/pages/ArticleDetail/ArticleDetail";
import MyPage from "@/pages/MyPage/MyPage";
import ReviewNotesPage from "@/pages/MyPage/ReviewNotes/ReviewNotesPage";
import TermsDictionaryPage from "@/pages/MyPage/TermsDictionary/TermsDictionaryPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* ✅ 새 온보딩 인트로 */}
      <Route path="/" element={<Intro1 />} />
      <Route path="/onboarding/intro/1" element={<Intro1 />} />
      <Route path="/onboarding/intro/2" element={<Intro2 />} />
      <Route path="/onboarding/intro/3" element={<Intro3 />} />
      <Route path="/onboarding/intro/4" element={<Intro4 />} />
      <Route path="/onboarding/intro/5" element={<Intro5 />} />
      <Route path="/onboarding/intro/6" element={<Intro6 />} />
      <Route path="/onboarding/intro/7" element={<Intro7 />} />

      {/* ✅ 기존 경로 유지용 리다이렉트 (지금 바로 파일 삭제하지 말라는 이유) */}
      <Route path="/onboarding/2" element={<Navigate to="/onboarding/intro/2" replace />} />
      <Route path="/onboarding/3" element={<Navigate to="/onboarding/intro/3" replace />} />
      <Route path="/onboarding/4" element={<Navigate to="/onboarding/intro/4" replace />} />

      {/* 다음 온보딩 단계 */}
      <Route path="/onboarding/topic" element={<OnboardingTopic />} />
      <Route path="/onboarding/alarm" element={<OnboardingAlarm />} />

      {/* 앱 라우트 */}
      <Route path="/home" element={<Home />} />
      <Route path="/recent-courses" element={<RecentCourses />} />
      <Route path="/saved-courses" element={<SavedCourses />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/learn/search" element={<LearnSearch />} />
      <Route path="/article/:articleId/prepare" element={<ArticlePrepare />} />
      <Route path="/login/success" element={<LoginSuccess />} />
      <Route path="/nie/session/:sessionId/step/:stepId" element={<StepRunner />} />
      <Route path="/nie/session/N/result" element={<EduResult />} />
      <Route path="/nie/session/I/result" element={<EduResult />} />
      <Route path="/article/:articleId" element={<ArticleDetail />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/mypage/review-notes" element={<ReviewNotesPage />} />
      <Route path="/mypage/terms" element={<TermsDictionaryPage />} />

      {/* 없는 경로는 홈(or /)로 보내기 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

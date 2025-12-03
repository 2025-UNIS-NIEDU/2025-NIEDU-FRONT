import { Routes, Route } from "react-router-dom";
import OnboardingIntro1 from "@/pages/onboarding/OnboardingIntro1";
import OnboardingIntro2 from "@/pages/onboarding/OnboardingIntro2";
import OnboardingIntro3 from "@/pages/onboarding/OnboardingIntro3";
import OnboardingIntro4 from "@/pages/onboarding/OnboardingIntro4";
import OnboardingTopic from "@/pages/onboarding/OnboardingTopic";
import OnboardingAlarm from "@/pages/onboarding/OnboardingAlarm";
import Home from "@/pages/Home/Home";
import RecentCourses from "@/pages/Home/RecentCourses";
import SavedCourses from "@/pages/Home/SavedCourses";
import Learn from "@/pages/Learn/Learn";
import ArticlePrepare from "@/pages/article/ArticlePrepare";
import LoginSuccess from "@/pages/LoginSuccess";
import StepRunner from "@/pages/article/session/StepRunner";
import EduResult from "@/components/edu/EduResult";
import ArticleDetail from "@/pages/ArticleDetail/ArticleDetail";
import MyPage from "@/pages/MyPage/MyPage";
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<OnboardingIntro1 />} />
      <Route path="/onboarding/2" element={<OnboardingIntro2 />} />
      <Route path="/onboarding/3" element={<OnboardingIntro3 />} />
      <Route path="/onboarding/4" element={<OnboardingIntro4 />} />
      <Route path="/onboarding/topic" element={<OnboardingTopic />} />
      <Route path="/onboarding/alarm" element={<OnboardingAlarm />} />
      <Route path="/home" element={<Home />} />
      <Route path="/recent-courses" element={<RecentCourses />} />
      <Route path="/saved-courses" element={<SavedCourses />} />
     <Route path="/learn" element={<Learn />} />
     <Route path="/article/:articleId/prepare" element={<ArticlePrepare />} />
     <Route path="/login/success" element={<LoginSuccess />} />
       <Route path="/nie/session/:sessionId/step/:stepId" element={<StepRunner />}  />
       <Route path="/nie/session/N/result" element={<EduResult />} />
       <Route path="/nie/session/I/result" element={<EduResult />} />
       <Route path="/article/:articleId" element={<ArticleDetail />} />
       <Route path="/mypage" element={<MyPage />} />
    </Routes>
  );
}

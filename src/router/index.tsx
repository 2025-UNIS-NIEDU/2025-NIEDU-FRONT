// src/router/index.tsx
import { Routes, Route, Navigate } from "react-router-dom";

import Intro1 from "@/pages/onboarding/intro/Intro1";
import Intro2 from "@/pages/onboarding/intro/Intro2";
import Intro3 from "@/pages/onboarding/intro/Intro3";
import Intro4 from "@/pages/onboarding/intro/Intro4";
import Intro5 from "@/pages/onboarding/intro/Intro5";
import Intro6 from "@/pages/onboarding/intro/Intro6";
import Intro7 from "@/pages/onboarding/intro/Intro7";

import OnboardingTopic from "@/pages/onboarding/OnboardingTopic";
import OnboardingAlarm from "@/pages/onboarding/OnboardingAlarm";

import Home from "@/pages/Home/Home";
import RecentCourses from "@/pages/Home/RecentCourses";
import SavedCourses from "@/pages/Home/SavedCourses";
import Learn from "@/pages/Learn/Learn";
import LearnSearch from "@/pages/Learn/LearnSearch";
import LearnTopicsPage from "@/pages/Learn/LearnTopicsPage";
import LearnPopularPage from "@/pages/Learn/LearnPopularPage";
import LearnPersonalizedPage from "@/pages/Learn/LearnPersonalizedPage";
import LearnNewPage from "@/pages/Learn/LearnNewPage";
import ArticlePrepare from "@/pages/article/ArticlePrepare";
import LoginSuccess from "@/pages/LoginSuccess";
import StepRunner from "@/pages/article/session/StepRunner";
import EduResult from "@/pages/quiz/EduResult";

import ArticleDetail from "@/pages/ArticleDetail/ArticleDetail";
import MyPage from "@/pages/MyPage/MyPage";
import LearningLogPage from "@/pages/MyPage/LearningLog/LearningLogPage";
import ReviewNotesPage from "@/pages/MyPage/ReviewNotes/ReviewNotesPage";
import TermsDictionaryPage from "@/pages/MyPage/TermsDictionary/TermsDictionaryPage";

import SettingsPage from "@/pages/MyPage/Settings/SettingsPage";
import EditProfilePage from "@/pages/MyPage/Settings/EditProfilePage";
import PushAlarmPage from "@/pages/MyPage/Settings/PushAlarmPage";
import PreferredTopicsPage from "@/pages/MyPage/Settings/PreferredTopicsPage";
import TermsPage from "@/pages/MyPage/Settings/TermsPage";
import PrivacyPage from "@/pages/MyPage/Settings/PrivacyPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Intro1 />} />
      <Route path="/onboarding/intro/1" element={<Intro1 />} />
      <Route path="/onboarding/intro/2" element={<Intro2 />} />
      <Route path="/onboarding/intro/3" element={<Intro3 />} />
      <Route path="/onboarding/intro/4" element={<Intro4 />} />
      <Route path="/onboarding/intro/5" element={<Intro5 />} />
      <Route path="/onboarding/intro/6" element={<Intro6 />} />
      <Route path="/onboarding/intro/7" element={<Intro7 />} />

      <Route path="/onboarding/2" element={<Navigate to="/onboarding/intro/2" replace />} />
      <Route path="/onboarding/3" element={<Navigate to="/onboarding/intro/3" replace />} />
      <Route path="/onboarding/4" element={<Navigate to="/onboarding/intro/4" replace />} />

      <Route path="/onboarding/topic" element={<OnboardingTopic />} />
      <Route path="/onboarding/alarm" element={<OnboardingAlarm />} />

      <Route path="/home" element={<Home />} />
      <Route path="/recent-courses" element={<RecentCourses />} />
      <Route path="/saved-courses" element={<SavedCourses />} />

      <Route path="/learn" element={<Learn />} />
      <Route path="/learn/search" element={<LearnSearch />} />
      <Route path="/learn/topics" element={<LearnTopicsPage />} />
      <Route path="/learn/popular" element={<LearnPopularPage />} />
      <Route path="/learn/personalized" element={<LearnPersonalizedPage />} />
      <Route path="/learn/new" element={<LearnNewPage />} />

      <Route path="/article/:articleId/prepare" element={<ArticlePrepare />} />
      <Route path="/login/success" element={<LoginSuccess />} />
      <Route path="/nie/session/:level/step/:stepId" element={<StepRunner />} />
      <Route path="/nie/session/I/result" element={<EduResult />} />
      <Route path="/article/result" element={<EduResult />} />
      <Route path="/article/:articleId" element={<ArticleDetail />} />

      <Route path="/mypage" element={<MyPage />} />
      <Route path="/mypage/settings" element={<SettingsPage />} />
      <Route path="/mypage/settings/edit" element={<EditProfilePage />} />
      <Route path="/mypage/settings/push" element={<PushAlarmPage />} />
      <Route path="/mypage/settings/topics" element={<PreferredTopicsPage />} />
      <Route path="/mypage/settings/terms" element={<TermsPage />} />
      <Route path="/mypage/settings/privacy" element={<PrivacyPage />} />
      <Route path="/mypage/log" element={<LearningLogPage />} />
      <Route path="/mypage/review-notes" element={<ReviewNotesPage />} />
      <Route path="/mypage/terms" element={<TermsDictionaryPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

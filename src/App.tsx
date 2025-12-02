import { BrowserRouter, Routes, Route } from "react-router-dom";
import OnboardingIntro1 from "./pages/onboarding/OnboardingIntro1";
import OnboardingIntro2 from "./pages/onboarding/OnboardingIntro2";
import OnboardingIntro3 from "@/pages/onboarding/OnboardingIntro3";
import OnboardingIntro4 from "@/pages/onboarding/OnboardingIntro4";
import Home from "@/pages/Home/Home";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnboardingIntro1 />} />
        <Route path="/onboarding/2" element={<OnboardingIntro2 />} />
        <Route path="/onboarding/3" element={<OnboardingIntro3 />} />
        <Route path="/onboarding/4" element={<OnboardingIntro4 />} />
        <Route path="/home" element={<Home />} />   {/* ✅ 추가 */}
      </Routes>
    </BrowserRouter>
  );
}

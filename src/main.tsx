import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "@/router";
import "./index.css";


// ✅ PWA: service worker 등록 (핵심!)
import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("새 버전이 있습니다! 새로고침하면 적용돼요.");
  },
  onOfflineReady() {
    console.log("오프라인에서도 실행할 준비가 되었습니다 ✅");
  },
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </StrictMode>
);

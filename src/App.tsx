import { BrowserRouter } from "react-router-dom";
import AppRouter from "@/router"; // 또는 "@/router/index" 너 프로젝트 경로에 맞게
import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

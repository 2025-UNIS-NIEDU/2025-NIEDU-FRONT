// src/pages/quiz/QuizStep.tsx
import { useParams } from "react-router-dom";

export default function QuizStep() {                // ✅ default export
  const { sessionId, stepId } = useParams();
  return (
    <div style={{ padding: 24 }}>
      <h1>퀴즈 진행</h1>
      <p>sessionId: {sessionId}</p>
      <p>stepId: {stepId}</p>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./ReviewNotesPage.module.css";

export default function ReviewNotesPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const date = sp.get("date"); // ❗ optional

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        let url = "/api/my/review-notes";
        if (date) url += `?date=${encodeURIComponent(date)}`; // ✅ 선택일만

        const res = await api.get<ApiResponse<any>>(url);
        const d = res.data?.data ?? {};

        const raw =
          d.reviewNotes ??
          d.quizzes ??
          [];

        const wrongOnly = raw.filter((q: any) =>
          q.isCorrect === false ||
          q.correct === false ||
          q.isAnswerCorrect === false ||
          q.result === false
        );

        setNotes(wrongOnly);
      } catch (e) {
        console.error("[review-notes]", e);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [date]);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <header className={styles.topBar}>
          <button onClick={() => nav(-1)}>←</button>
          <h1>복습 노트</h1>
          <div />
        </header>

        {loading ? (
          <p>불러오는 중...</p>
        ) : notes.length === 0 ? (
          <p>틀린 문제가 없어요.</p>
        ) : (
          notes.map((n, i) => (
            <pre key={i}>{JSON.stringify(n, null, 2)}</pre>
          ))
        )}
      </div>

      <BottomNav activeTab="mypage" />
    </div>
  );
}

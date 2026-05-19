import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./LearningLogPage.module.css";

export default function LearningLogPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const date = sp.get("date"); // ❗ 필수

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!date) return;

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiResponse<any>>(
          `/api/my/learning-log?date=${encodeURIComponent(date)}`
        );

        const d = res.data?.data ?? {};
        setSessions(d.sessions ?? []);
        setTotalTime(d.totalStudySeconds ?? 0);
        setStreak(d.streakDays ?? 0);
      } catch (e) {
        console.error("[learning-log]", e);
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
          <h1>학습 요약</h1>
          <div />
        </header>

        <section>
          <p>총 학습 시간: {totalTime}s</p>
          <p>연속 출석: {streak}일</p>
        </section>

        <section>
          <h2>학습 세션</h2>
          {loading ? (
            <p>불러오는 중...</p>
          ) : sessions.length === 0 ? (
            <p>학습 기록 없음</p>
          ) : (
            sessions.map((s, i) => (
              <div key={i} className={styles.sessionCard}>
                <p>{s.title}</p>
                <p>진행률 {s.progressRate}%</p>
                <button onClick={() => nav(`/article/${s.courseId}`)}>→</button>
              </div>
            ))
          )}
        </section>
      </div>

      <BottomNav activeTab="mypage" />
    </div>
  );
}

// src/pages/MyPage/LearningLog/LearningLogPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import styles from "./LearningLogPage.module.css";

type LogSession = {
  sessionId?: number;
  topic?: string;
  subTopic?: string;
  level?: "N" | "I" | "E";
  title?: string;
  source?: string;
  publishedAt?: string;
  accuracy?: number; // 0~100
};

type LearningLogData = {
  totalStudySeconds?: number;
  streakDays?: number;
  sessions?: LogSession[];
};

const pad2 = (n: number) => String(n).padStart(2, "0");

function formatDuration(sec?: number) {
  if (!sec || sec <= 0) return "0분 0초";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${s}초`;
}

function toKoreanLevel(code?: string) {
  if (code === "N") return "N단계";
  if (code === "I") return "I단계";
  if (code === "E") return "E단계";
  return "";
}

export default function LearningLogPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const date = sp.get("date") ?? "";

  const [data, setData] = useState<LearningLogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const sessionCount = data?.sessions?.length ?? 0;

  const pages = useMemo(() => {
    return Array.from({ length: Math.max(1, sessionCount) }, (_, i) => i + 1);
  }, [sessionCount]);

  useEffect(() => {
    if (!date) return;

    const run = async () => {
      setLoading(true);
      try {
        // 1) 학습 로그 전용 엔드포인트 시도
        const res = await api.get<ApiResponse<any>>(
          `/api/my/learning-log?date=${encodeURIComponent(date)}`
        );
        const d = res.data?.data ?? null;

        const sessions: LogSession[] = Array.isArray(d?.sessions)
          ? d.sessions
          : Array.isArray(d?.learningSessions)
            ? d.learningSessions
            : [];

        setData({
          totalStudySeconds: Number(d?.totalStudySeconds ?? d?.totalStudyTimeSeconds ?? 0) || 0,
          streakDays: Number(d?.streakDays ?? d?.attendanceStreak ?? 0) || 0,
          sessions,
        });
      } catch (e1) {
        // 2) 없으면 review-notes 쪽 응답으로 최대한 fallback
        try {
          const res2 = await api.get<ApiResponse<any>>(
            `/api/my/review-notes?date=${encodeURIComponent(date)}`
          );
          const d2 = res2.data?.data ?? null;
          const sessions: LogSession[] = Array.isArray(d2?.sessions)
            ? d2.sessions
            : d2
              ? [
                  {
                    sessionId: d2?.sessionId,
                    topic: d2?.topic ?? d2?.mainTopic,
                    subTopic: d2?.subTopic,
                    level: d2?.level ?? d2?.stage,
                    title: d2?.title ?? d2?.articleTitle,
                    source: d2?.source,
                    publishedAt: d2?.publishedAt,
                    accuracy: d2?.accuracy ?? d2?.correctRate,
                  },
                ]
              : [];
          setData({
            totalStudySeconds: Number(d2?.totalStudySeconds ?? d2?.totalStudyTimeSeconds ?? 0) || 0,
            streakDays: Number(d2?.streakDays ?? d2?.attendanceStreak ?? 0) || 0,
            sessions,
          });
        } catch (e2) {
          console.error("[LearningLog] fetch error:", e1, e2);
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [date]);

  useEffect(() => {
    setActiveIndex((prev) => {
      const max = Math.max(0, sessionCount - 1);
      return Math.min(prev, max);
    });
  }, [sessionCount]);

  const goPrev = () => setActiveIndex((p) => Math.max(0, p - 1));
  const goNext = () => setActiveIndex((p) => Math.min(sessionCount - 1, p + 1));

  const summaryDate = useMemo(() => {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }, [date]);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <header className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => nav(-1)} aria-label="뒤로가기">
            <img src="/icons/fluent_ios-arrow-24-filled.svg" alt="" />
          </button>
          <h1 className={styles.title}>학습 요약</h1>
          <div className={styles.rightDummy} />
        </header>

        <div className={styles.pageNav}>
          <button className={styles.navArrow} onClick={goPrev} aria-label="이전" disabled={activeIndex <= 0}>
            ◀
          </button>

          <div className={styles.pageNums}>
            {pages.map((n, idx) => (
              <button
                key={n}
                className={`${styles.pageNum} ${idx === activeIndex ? styles.pageNumActive : ""}`}
                onClick={() => setActiveIndex(idx)}
                aria-label={`${n}번째`}
              >
                {n}
              </button>
            ))}
          </div>

          <button className={styles.navArrow} onClick={goNext} aria-label="다음" disabled={activeIndex >= sessionCount - 1}>
            ▶
          </button>
        </div>

        <div className={styles.sectionLabel}>학습 로그</div>

        <div className={styles.summaryRow}>
          <div className={styles.summaryItem}>
            <img src="/icons/icon-clock.svg" alt="" className={styles.summaryIcon} />
            <div>
              <div className={styles.summaryValue}>{loading ? "-" : formatDuration(data?.totalStudySeconds)}</div>
            </div>
          </div>

          <div className={styles.summaryItem}>
            <img src="/icons/icon-fire.svg" alt="" className={styles.summaryIcon} />
            <div>
              <div className={styles.summaryValue}>{loading ? "-" : `${data?.streakDays ?? 0}일`}</div>
            </div>
          </div>
        </div>

        {summaryDate && <div className={styles.dateCaption}>{summaryDate}</div>}

        <div className={styles.sectionLabel}>학습 세션</div>

        {loading ? (
          <div className={styles.loading}>불러오는 중...</div>
        ) : !data || !data.sessions || data.sessions.length === 0 ? (
          <div className={styles.empty}>해당 날짜의 학습 기록이 없어요.</div>
        ) : (
          <div className={styles.sessionList}>
            {data.sessions.map((s, idx) => {
              const accuracy = typeof s.accuracy === "number" ? s.accuracy : null;
              const published = s.publishedAt
                ? (() => {
                    const d = new Date(s.publishedAt);
                    if (Number.isNaN(d.getTime())) return s.publishedAt;
                    return `${String(d.getFullYear()).slice(2)}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}.`;
                  })()
                : "";

              return (
                <button
                  key={`${s.sessionId ?? idx}`}
                  className={styles.sessionCard}
                  onClick={() => {
                    setActiveIndex(idx);
                    const qs = new URLSearchParams();
                    qs.set("date", date);
                    if (s.sessionId) qs.set("sessionId", String(s.sessionId));
                    nav(`/mypage/review-notes?${qs.toString()}`);
                  }}
                  type="button"
                >
                  <div className={styles.sessionTopRow}>
                    <div className={styles.chips}>
                      {s.topic && <span className={styles.chip}>{s.topic}</span>}
                      {s.subTopic && <span className={styles.chipHash}>#{s.subTopic}</span>}
                    </div>
                    {s.level && <span className={styles.levelChip}>{toKoreanLevel(s.level)}</span>}
                  </div>

                  <div className={styles.sessionTitle}>{s.title ?? ""}</div>

                  <div className={styles.sessionBottomRow}>
                    <div className={styles.sourceRow}>
                      {s.source ? <span>{s.source}</span> : <span />}
                      {published ? <span>{published} 발행</span> : <span />}
                    </div>

                    <div className={styles.rightArea}>
                      <div className={styles.arrowCircle}>
                        <img src="/icons/fluent_arrow-right-24-filled.svg" alt="" />
                      </div>
                      {accuracy !== null && <div className={styles.accuracy}>정답률 {accuracy}%</div>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.bottomSpace} />
      </div>

      <BottomNav activeTab="mypage" />
    </div>
  );
}

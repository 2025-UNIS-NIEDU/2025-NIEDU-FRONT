// src/pages/MyPage/LearningLog/LearningLogPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import styles from "./LearningLogPage.module.css";

type LogSession = {
  sessionId?: number;
  courseId?: number;

  category?: string; // 정치/경제/사회… (서버가 주면 사용)
  keywords?: string[]; // ✅ 아티클 디테일처럼 #키워드

  title?: string;
  level?: "N" | "I" | "E";

  source?: string;
  publishedAt?: string;

  // ✅ 진행률 (정답률 말고)
  progressRate?: number; // 0~100

  // fallback (서버가 accuracy만 주는 경우)
  accuracy?: number;
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
        const res = await api.get<ApiResponse<any>>(
          `/api/my/learning-log?date=${encodeURIComponent(date)}`
        );
        const d = res.data?.data ?? null;

        const sessionsRaw =
          Array.isArray(d?.sessions) ? d.sessions :
          Array.isArray(d?.learningSessions) ? d.learningSessions :
          Array.isArray(d?.logs) ? d.logs : [];

        const sessions: LogSession[] = Array.isArray(sessionsRaw)
          ? sessionsRaw.map((s: any) => ({
              sessionId: s?.sessionId,
              courseId: s?.courseId ?? s?.articleId ?? s?.eduCourseId,

              category: s?.category ?? s?.topic ?? s?.mainTopic,
              keywords: Array.isArray(s?.keywords) ? s.keywords : Array.isArray(s?.tags) ? s.tags : [],

              title: s?.title ?? s?.articleTitle ?? "",
              level: s?.level ?? s?.stage ?? "",

              source: s?.source ?? s?.publisher,
              publishedAt: s?.publishedAt,

              progressRate:
                typeof s?.progressRate === "number" ? s.progressRate :
                typeof s?.progress === "number" ? s.progress :
                undefined,

              accuracy: typeof s?.accuracy === "number" ? s.accuracy : undefined,
            }))
          : [];

        // ✅ 요청: 진행률 0%는 “당일 학습 로그”에서 제외
        const filtered = sessions.filter((s) => {
          if (typeof s.progressRate === "number") return s.progressRate > 0;
          return true;
        });

        setData({
          totalStudySeconds: Number(d?.totalStudySeconds ?? d?.totalStudyTimeSeconds ?? 0) || 0,
          streakDays: Number(d?.streakDays ?? d?.attendanceStreak ?? 0) || 0,
          sessions: filtered,
        });
      } catch (e) {
        console.error("[LearningLog] fetch error:", e);
        setData(null);
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
            <div className={styles.summaryValue}>
              {loading ? "-" : formatDuration(data?.totalStudySeconds)}
            </div>
          </div>

          <div className={styles.summaryItem}>
            <img src="/icons/icon-fire.svg" alt="" className={styles.summaryIcon} />
            <div className={styles.summaryValue}>
              {loading ? "-" : `${data?.streakDays ?? 0}일`}
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
              const published = s.publishedAt
                ? (() => {
                    const d = new Date(s.publishedAt);
                    if (Number.isNaN(d.getTime())) return s.publishedAt;
                    return `${String(d.getFullYear()).slice(2)}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}.`;
                  })()
                : "";

              const progress =
                typeof s.progressRate === "number"
                  ? s.progressRate
                  : typeof s.accuracy === "number"
                    ? s.accuracy
                    : null;

              return (
                <div key={`${s.sessionId ?? idx}`} className={styles.sessionCard}>
                  <div className={styles.sessionTopRow}>
                    <div className={styles.chips}>
                      {s.category && <span className={styles.chip}>{s.category}</span>}

                      {/* ✅ title이 아니라 #키워드 */}
                      {(s.keywords ?? []).slice(0, 2).map((k, i) => (
                        <span key={`${k}-${i}`} className={styles.chipHash}>
                          #{k}
                        </span>
                      ))}
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
                      {/* ✅ 화살표 누르면 ArticleDetail로 */}
                      <button
                        type="button"
                        className={styles.arrowCircle}
                        onClick={() => {
                          const id = s.courseId;
                          if (!id) return;
                          nav(`/article/${id}`);
                        }}
                        aria-label="아티클 디테일로 이동"
                      >
                        <img src="/icons/fluent_arrow-right-24-filled.svg" alt="" />
                      </button>

                      {/* ✅ 정답률 -> 진행률 */}
                      {progress !== null && <div className={styles.accuracy}>진행률 {progress}%</div>}
                    </div>
                  </div>
                </div>
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

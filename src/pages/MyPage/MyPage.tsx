// src/pages/MyPage/MyPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import styles from "./MyPage.module.css";

import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

type DateNavigatorData = {
  currentYear: number;
  currentMonth: number; // 1~12
  range?: { start: string; end: string };
  earliestLearning?: string;
  latestLearning?: string;
};

type CalendarCourse = {
  topic?: string;
  subTopic?: string;
  keywords?: string[];
  progressRate?: number;
  extra?: number;
};

type CalendarDay = {
  date: string;
  courses: CalendarCourse[];
};

type CalendarData = {
  year: number;
  month: number;
  days: CalendarDay[];
};

type MeData = {
  nickname?: string;
  profileImageUrl?: string;
};

function toISODate(year: number, month0: number, day: number) {
  const m = String(month0 + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

function isSameYM(a: { y: number; m: number }, b: { y: number; m: number }) {
  return a.y === b.y && a.m === b.m;
}

function clampMonth(y: number, m0: number) {
  let y2 = y;
  let m2 = m0;
  while (m2 < 0) {
    y2 -= 1;
    m2 += 12;
  }
  while (m2 > 11) {
    y2 += 1;
    m2 -= 12;
  }
  return { y: y2, m: m2 };
}

function makeCalendarMatrix(year: number, month0: number) {
  const first = new Date(year, month0, 1);
  const startDay = first.getDay(); // 0(일)~6(토)
  const lastDate = new Date(year, month0 + 1, 0).getDate();

  const cells: Array<number | null> = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function MyPage() {
  const nav = useNavigate();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());

  const [me, setMe] = useState<MeData | null>(null);

  const [navData, setNavData] = useState<DateNavigatorData | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);

  const [loadingNav, setLoadingNav] = useState(true);
  const [loadingCal, setLoadingCal] = useState(true);

  // ✅ 날짜별 학습로그 태그 보강용
  const [logTagMap, setLogTagMap] = useState<Record<string, { topic?: string; subTopic?: string; keywords?: string[] }>>(
    {}
  );

  const daysArray = useMemo(() => makeCalendarMatrix(year, month0), [year, month0]);

  const isThisMonthToday = year === today.getFullYear() && month0 === today.getMonth();
  const todayDate = today.getDate();

  const monthLabel = `${year}년 ${month0 + 1}월`;

  const fetchMe = async () => {
    try {
      const res = await api.get<ApiResponse<MeData>>("/api/user/me");
      setMe(res.data?.data ?? null);
    } catch {
      setMe(null);
    }
  };

  const fetchNavigator = async () => {
    const res = await api.get<ApiResponse<DateNavigatorData>>("/api/mypage/learning-log/navigator");
    setNavData(res.data?.data ?? null);
  };

  const fetchCalendar = async (y: number, m0: number) => {
    const res = await api.get<ApiResponse<CalendarData>>("/api/mypage/learning-log/calendar", {
      params: { year: y, month: m0 + 1 },
    });
    setCalendarData(res.data?.data ?? null);
  };

  const fetchTags = async (y: number, m0: number) => {
    try {
      const start = new Date(y, m0, 1);
      const end = new Date(y, m0 + 1, 0);

      const s = toISODate(start.getFullYear(), start.getMonth(), 1);
      const e = toISODate(end.getFullYear(), end.getMonth(), end.getDate());

      const res = await api.get<ApiResponse<any>>("/api/mypage/learning-log/tags", {
        params: { startDate: s, endDate: e },
      });

      const raw = res.data?.data;
      const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.days) ? raw.days : [];

      const map: Record<string, { topic?: string; subTopic?: string; keywords?: string[] }> = {};
      for (const it of arr) {
        const date = String(it?.date ?? it?.learningDate ?? "");
        if (!date) continue;

        const topic = typeof it?.topic === "string" ? it.topic : undefined;
        const subTopic = typeof it?.subTopic === "string" ? it.subTopic : undefined;

        const kwsRaw = it?.keywords ?? it?.tags ?? it?.keywordList ?? [];
        const keywords = Array.isArray(kwsRaw) ? kwsRaw.map(String).filter(Boolean) : undefined;

        map[date] = { topic, subTopic, keywords };
      }
      setLogTagMap(map);
    } catch {
      setLogTagMap({});
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingNav(true);
        setLoadingCal(true);

        await Promise.all([fetchMe(), fetchNavigator(), fetchCalendar(year, month0), fetchTags(year, month0)]);
      } finally {
        if (!alive) return;
        setLoadingNav(false);
        setLoadingCal(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingCal(true);
        await Promise.all([fetchCalendar(year, month0), fetchTags(year, month0)]);
      } finally {
        if (!alive) return;
        setLoadingCal(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [year, month0]);

  useEffect(() => {
    if (!navData) return;

    const current = { y: navData.currentYear, m: navData.currentMonth - 1 };
    if (!isSameYM({ y: year, m: month0 }, current)) {
      setYear(current.y);
      setMonth0(current.m);
    }
  }, [navData]);

  const dayToCourses = useMemo(() => {
    const map = new Map<number, CalendarCourse[]>();
    if (!calendarData?.days) return map;

    for (const d of calendarData.days) {
      const parsed = parseISODate(d.date);
      if (!parsed) continue;
      if (parsed.y !== year || parsed.m !== month0) continue;

      map.set(parsed.d, Array.isArray(d.courses) ? d.courses : []);
    }
    return map;
  }, [calendarData, year, month0]);

  const canGoPrev = useMemo(() => {
    if (!navData?.earliestLearning) return true;
    const p = parseISODate(navData.earliestLearning);
    if (!p) return true;
    const earliest = { y: p.y, m: p.m };
    const current = { y: year, m: month0 };
    if (current.y < earliest.y) return false;
    if (current.y === earliest.y && current.m <= earliest.m) return false;
    return true;
  }, [navData, year, month0]);

  const canGoNext = useMemo(() => {
    if (!navData?.latestLearning) return true;
    const p = parseISODate(navData.latestLearning);
    if (!p) return true;
    const latest = { y: p.y, m: p.m };
    const current = { y: year, m: month0 };
    if (current.y > latest.y) return false;
    if (current.y === latest.y && current.m >= latest.m) return false;
    return true;
  }, [navData, year, month0]);

  const goPrevMonth = () => {
    if (!canGoPrev) return;
    const next = clampMonth(year, month0 - 1);
    setYear(next.y);
    setMonth0(next.m);
  };

  const goNextMonth = () => {
    if (!canGoNext) return;
    const next = clampMonth(year, month0 + 1);
    setYear(next.y);
    setMonth0(next.m);
  };

  const nickname = me?.nickname ?? "사용자";
  const profileImageUrl = me?.profileImageUrl ?? "";

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.profile}>
            <div className={styles.avatar}>
              {profileImageUrl ? <img src={profileImageUrl} alt="" /> : <div className={styles.avatarFallback} />}
            </div>
            <div>
              <div className={styles.name}>{nickname}</div>
              <button className={styles.settingsBtn} onClick={() => nav("/mypage/settings")}>
                설정
              </button>
            </div>
          </div>

          <div className={styles.menuRow}>
            <button className={styles.menuBtn} onClick={() => nav("/mypage/log")}>
              학습 로그
            </button>
            <button className={styles.menuBtn} onClick={() => nav("/mypage/review-notes")}>
              복습 노트
            </button>
            <button className={styles.menuBtn} onClick={() => nav("/mypage/terms")}>
              용어 사전
            </button>
          </div>
        </div>

        <div className={styles.calendarWrap}>
          <div className={styles.monthRow}>
            <button className={styles.monthArrow} onClick={goPrevMonth} disabled={!canGoPrev} aria-label="이전 달">
              <img src="/icons/Polygon 3.svg" alt="이전 달" className={styles.monthArrowIcon} />
            </button>

            <div className={styles.monthLabel}>{loadingNav ? "..." : monthLabel}</div>

            <button className={styles.monthArrow} onClick={goNextMonth} disabled={!canGoNext} aria-label="다음 달">
              <img src="/icons/Polygon 4.svg" alt="다음 달" className={styles.monthArrowIcon} />
            </button>
          </div>

          {loadingCal && !calendarData ? (
            <p style={{ padding: 12, opacity: 0.7 }}>캘린더 불러오는 중...</p>
          ) : (
            <div className={styles.grid}>
              {daysArray.map((day, idx) => {
                if (day === null) return <div key={idx} className={styles.emptyCell} />;

                const isToday = isThisMonthToday && day === todayDate;
                const iso = toISODate(year, month0, day);

                const coursesRaw = dayToCourses.get(day) ?? [];
                const courses = coursesRaw.filter((c) => {
                  if (typeof c.progressRate === "number") return c.progressRate > 0;
                  return true;
                });

                const coursePairs = courses
                  .filter((c) => c?.topic || c?.subTopic)
                  .map((c) => ({
                    topic: typeof c.topic === "string" ? c.topic : "",
                    subTopic: typeof c.subTopic === "string" ? c.subTopic : "",
                  }));

                const visibleCourses = coursePairs.slice(0, 3);
                const extraCount = Math.max(0, coursePairs.length - visibleCourses.length);

                const fallbackTopic = logTagMap[iso]?.topic;
                const fallbackSubTopic = logTagMap[iso]?.subTopic;
                const fallbackLabel =
                  typeof fallbackTopic === "string" && fallbackTopic.length > 0
                    ? `${fallbackTopic}${fallbackSubTopic ? `#${fallbackSubTopic}` : ""}`
                    : null;

                const hasLog = !!fallbackLabel;
                const hasData = coursePairs.length > 0 || hasLog;

                return (
                  <div
                    key={idx}
                    className={styles.dayCell}
                    onClick={() => {
                      if (!hasData) return;
                    }}
                    style={{ cursor: hasData ? "pointer" : "default" }}
                    aria-disabled={!hasData}
                  >
                    <div className={`${styles.dayNumber} ${isToday ? styles.today : ""}`}>{day}</div>

                    {(visibleCourses.length > 0 || !!fallbackLabel) && (
                      <div className={styles.tag}>
                        <span className={styles.courseLine}>
                          {visibleCourses.length > 0
                            ? visibleCourses.map((c, i) => {
                                const label = `${c.topic}${c.subTopic ? `#${c.subTopic}` : ""}`;
                                return (
                                  <span key={`${label}-${i}`} className={styles.courseChip} title={label}>
                                    {label}
                                  </span>
                                );
                              })
                            : fallbackLabel
                              ? (
                                  <span className={styles.courseChip} title={fallbackLabel}>
                                    {fallbackLabel}
                                  </span>
                                )
                              : null}

                          {extraCount > 0 ? <span className={styles.courseMore}>+{extraCount}</span> : null}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav activeTab="mypage" />
    </div>
  );
}

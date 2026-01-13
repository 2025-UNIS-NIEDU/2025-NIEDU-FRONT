import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import styles from "./MyPage.module.css";

import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

/* ---------- types ---------- */

type DateNavigatorData = {
  currentYear: number;
  currentMonth: number;
};

type CalendarDay = {
  date: string; // YYYY-MM-DD
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

type StreakData = {
  streak?: number;
};

/* ---------- util ---------- */

const toISODate = (y: number, m0: number, d: number) =>
  `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/* ---------- component ---------- */

export default function MyPage() {
  const nav = useNavigate();

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth0 = today.getMonth();
  const todayDate = today.getDate();

  /* user */
  const [nickname, setNickname] = useState("사용자 님");
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

  /* calendar */
  const [year, setYear] = useState(todayYear);
  const [month0, setMonth0] = useState(todayMonth0);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);

  /* 🔑 날짜별 학습 로그 요약 (learning-log 재활용) */
  const [dailyLogMap, setDailyLogMap] = useState<
    Record<
      string,
      {
        categories: string[];
        keywords: string[];
      }
    >
  >({});

  const monthForApi = month0 + 1;

  /* ---------- user + streak ---------- */
  useEffect(() => {
    const run = async () => {
      const [meRes, streakRes] = await Promise.all([
        api.get<ApiResponse<MeData>>("/api/user/me"),
        api.get<ApiResponse<StreakData>>("/api/attendance/streak"),
      ]);

      const me = meRes.data?.data;
      if (me?.nickname) setNickname(`${me.nickname} 님`);
      if (me?.profileImageUrl) setProfileUrl(me.profileImageUrl);

      const s = streakRes.data?.data?.streak;
      if (typeof s === "number") setStreak(s);
    };
    run();
  }, []);

  /* ---------- calendar ---------- */
  useEffect(() => {
    const run = async () => {
      const res = await api.get<ApiResponse<CalendarData>>(
        `/api/my/calendar?year=${year}&month=${monthForApi}`
      );
      setCalendarData(res.data?.data ?? null);
    };
    run();
  }, [year, monthForApi]);

  /* ---------- 🔥 핵심: calendar + learning-log 결합 ---------- */
  useEffect(() => {
    if (!calendarData?.days) return;

    const run = async () => {
      const map: Record<string, { categories: string[]; keywords: string[] }> = {};

      await Promise.all(
        calendarData.days.map(async (d) => {
          try {
            const res = await api.get<ApiResponse<any>>(
              `/api/my/learning-log?date=${d.date}`
            );

            const sessions = res.data?.data?.sessions ?? [];
            if (sessions.length === 0) return;

const categories: string[] = Array.from(
  new Set(
    sessions
      .map((s: any) => s.category)
      .filter((v: unknown): v is string => typeof v === "string")
  )
);

const keywords: string[] = Array.from(
  new Set(
    sessions
      .flatMap((s: any) => (Array.isArray(s.keywords) ? s.keywords : []))
      .filter((v: unknown): v is string => typeof v === "string")
  )
);


            map[d.date] = { categories, keywords };
          } catch {
            /* 로그 없는 날 무시 */
          }
        })
      );

      setDailyLogMap(map);
    };

    run();
  }, [calendarData]);

  /* ---------- calendar grid ---------- */
  const firstDay = new Date(year, month0, 1).getDay();
  const lastDate = new Date(year, month0 + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);
  for (let d = 1; d <= lastDate; d++) daysArray.push(d);

  const isThisMonthToday = year === todayYear && month0 === todayMonth0;

  /* ---------- render ---------- */
  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* header */}
        <h1 className={styles.title}>마이페이지</h1>

        {/* profile */}
        <div className={styles.profileBox}>
          <img src={profileUrl ?? "/icons/Ellipse 25.svg"} />
          <div>
            <p className={styles.name}>{nickname}</p>
            <p className={styles.streak}>
              {streak === null ? "출석 정보 불러오는 중..." : `${streak}일 연속 출석`}
            </p>
          </div>
        </div>

        {/* calendar */}
        <div className={styles.grid}>
          {daysArray.map((day, idx) => {
            if (day === null) return <div key={idx} />;

            const iso = toISODate(year, month0, day);
            const log = dailyLogMap[iso];

            const keywords = log?.keywords ?? [];
            const categories = log?.categories ?? [];

            return (
              <div
                key={idx}
                className={styles.dayCell}
                onClick={() =>
                  log && nav(`/mypage/log?date=${encodeURIComponent(iso)}`)
                }
              >
                <div
                  className={`${styles.dayNumber} ${
                    isThisMonthToday && day === todayDate ? styles.today : ""
                  }`}
                >
                  {day}
                </div>

                {(keywords.length > 0 || categories.length > 0) && (
                  <div className={styles.tag}>
                    {keywords.length > 0
                      ? keywords.slice(0, 2).map((k) => (
                          <span key={k} className={styles.tagWeak}>
                            #{k}
                          </span>
                        ))
                      : categories.slice(0, 1).map((c) => (
                          <span key={c} className={styles.tagStrong}>
                            {c}
                          </span>
                        ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav activeTab="mypage" />
    </div>
  );
}

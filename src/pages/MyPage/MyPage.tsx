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
  range: { start: string; end: string };
  earliestLearning: string;
  latestLearning: string;
};

type CalendarCourse = {
  // ✅ 서버가 아직 topic/subTopic을 주는 경우도 있어서 유지
  topic?: string;
  subTopic?: string;

  // ✅ 우리가 원하는 키워드 태그 (ArticleDetail에서 보던 #키워드들)
  keywords?: string[];

  // ✅ 진행률(0%면 표시/로그 포함 제외)
  progressRate?: number; // 0~100

  extra?: number; // { extra: 2 }
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

type StreakData = {
  streak?: number;
  streakDays?: number;
  attendanceStreak?: number;
  todayAttended?: boolean;
};

const toISODate = (y: number, m0: number, d: number) => {
  const mm = String(m0 + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
};

export default function MyPage() {
  const nav = useNavigate();

  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth0 = today.getMonth();
  const todayDate = today.getDate();

  // user
  const [nickname, setNickname] = useState("사용자 님");
  const [streak, setStreak] = useState<number | null>(null);
  const [serverProfileUrl, setServerProfileUrl] = useState<string | null>(null);

  // calendar state
  const [year, setYear] = useState(todayYear);
  const [month0, setMonth0] = useState(todayMonth0);

  // API states
  const [navData, setNavData] = useState<DateNavigatorData | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);

  const [loadingNav, setLoadingNav] = useState(true);
  const [loadingCal, setLoadingCal] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const monthForApi = month0 + 1;

  // ✅ 유저 프로필 + 출석 streak (필드명 여러 케이스 대응)
  useEffect(() => {
    const run = async () => {
      setLoadingUser(true);
      try {
        const [meRes, streakRes] = await Promise.all([
          api.get<ApiResponse<MeData>>("/api/user/me"),
          api.get<ApiResponse<StreakData>>("/api/attendance/streak"),
        ]);

        const me = meRes.data?.data;
        const st = streakRes.data?.data;

        if (me?.nickname) setNickname(`${me.nickname} 님`);
        if (me?.profileImageUrl) setServerProfileUrl(me.profileImageUrl);

        const s =
          (typeof st?.streak === "number" && st.streak) ||
          (typeof st?.streakDays === "number" && st.streakDays) ||
          (typeof st?.attendanceStreak === "number" && st.attendanceStreak);

        if (typeof s === "number") setStreak(s);
      } catch (e) {
        console.error("[MyPage] user/streak error:", e);
      } finally {
        setLoadingUser(false);
      }
    };

    void run();
  }, []);

  // 날짜 네비게이터
  useEffect(() => {
    const run = async () => {
      setLoadingNav(true);
      setErrorMsg(null);
      try {
        const res = await api.get<ApiResponse<DateNavigatorData>>("/api/my/date-navigator");
        const d = res.data?.data;

        if (d?.currentYear && d?.currentMonth) {
          setNavData(d);
          setYear(d.currentYear);
          setMonth0(Math.max(0, Math.min(11, d.currentMonth - 1)));
        }
      } catch (e) {
        console.error("[MyPage] date-navigator error:", e);
        setErrorMsg("마이페이지 정보를 불러오지 못했어요. (로그인/토큰 확인)");
      } finally {
        setLoadingNav(false);
      }
    };

    void run();
  }, []);

  // 캘린더
  useEffect(() => {
    const run = async () => {
      setLoadingCal(true);
      setErrorMsg(null);
      try {
        const res = await api.get<ApiResponse<CalendarData>>(
          `/api/my/calendar?year=${year}&month=${monthForApi}`
        );
        setCalendarData(res.data?.data ?? null);
      } catch (e) {
        console.error("[MyPage] calendar error:", e);
        setErrorMsg("캘린더를 불러오지 못했어요. (로그인/토큰 확인)");
        setCalendarData(null);
      } finally {
        setLoadingCal(false);
      }
    };

    void run();
  }, [year, monthForApi]);

  // local calendar grid
  const firstDay = new Date(year, month0, 1).getDay();
  const lastDate = new Date(year, month0 + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);
  for (let d = 1; d <= lastDate; d++) daysArray.push(d);

  // day -> courses map
  const dayToCourses = useMemo(() => {
    const map = new Map<number, CalendarCourse[]>();
    const days = calendarData?.days ?? [];

    for (const item of days) {
      const dt = new Date(item.date);
      const dayNum = Number.isNaN(dt.getTime())
        ? Number(String(item.date).slice(8, 10))
        : dt.getDate();

      const courses = Array.isArray(item.courses) ? item.courses : [];
      if (!Number.isNaN(dayNum)) map.set(dayNum, courses);
    }
    return map;
  }, [calendarData]);

  // month nav
  const handlePrevMonth = () => {
    setMonth0((prev) => {
      if (prev === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setMonth0((prev) => {
      if (prev === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const isThisMonthToday = month0 === todayMonth0 && year === todayYear;

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 상단 */}
        <div className={styles.topBar}>
          <h1 className={styles.title}>마이페이지</h1>
          <button type="button" className={styles.settingsButton}>
            <img src="/icons/icon-settings.svg" alt="" className={styles.settingsIcon} />
            <span>설정</span>
          </button>
        </div>

        {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

        {/* 프로필 영역 */}
        <div className={styles.profileBox}>
          <div className={styles.profileImageWrapper}>
            <img
              src="/icons/Ellipse 25.svg"
              alt="프로필 프레임"
              className={styles.profileFrame}
            />
            {serverProfileUrl && (
              <img src={serverProfileUrl} alt="프로필" className={styles.profilePhoto} />
            )}

            {/* ✅ 요청: 프로필 옆 + 제거 (업로드 UI 제거) */}
          </div>

          <div>
            <p className={styles.name}>{loadingUser ? "불러오는 중..." : nickname}</p>
            <p className={styles.streak}>
              {streak === null ? "출석 정보를 불러오는 중..." : `${streak}일 연속 출석하셨어요!`}
            </p>
          </div>
        </div>

        {/* 용어 사전 */}
        <div
          className={styles.sectionTitle}
          role="button"
          tabIndex={0}
          onClick={() => nav("/mypage/terms")}
          onKeyDown={(e) => e.key === "Enter" && nav("/mypage/terms")}
        >
          <img src="/icons/majesticons_book.svg" alt="" className={styles.sectionIcon} />
          <span>용어 사전</span>
        </div>

        {/* 복습 노트 */}
        <div
          className={styles.sectionTitle}
          role="button"
          tabIndex={0}
          onClick={() => {
            const iso = toISODate(todayYear, todayMonth0, todayDate);
            nav(`/mypage/review-notes?date=${encodeURIComponent(iso)}`);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const iso = toISODate(todayYear, todayMonth0, todayDate);
              nav(`/mypage/review-notes?date=${encodeURIComponent(iso)}`);
            }
          }}
        >
          <img src="/icons/fluent_note-24-filled.svg" alt="" className={styles.sectionIcon} />
          <span>복습 노트</span>
        </div>

        {/* 달력 */}
        <div className={styles.calendarBox}>
          <div className={styles.monthHeader}>
            <button className={styles.monthArrow} type="button" onClick={handlePrevMonth}>
              <img
                src="/icons/Polygon 4.svg"
                alt="이전 달"
                className={`${styles.monthArrowIcon} ${styles.monthArrowLeft}`}
              />
            </button>

            <span className={styles.monthLabel}>
              {year}년 {month0 + 1}월
            </span>

            <button className={styles.monthArrow} type="button" onClick={handleNextMonth}>
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

                // ✅ 요청: 진행률 0%는 “당일 학습 로그 태그”에서 제외
                const courses = coursesRaw.filter((c) => {
                  if (typeof c.progressRate === "number") return c.progressRate > 0;
                  return true; // progressRate가 없으면 일단 표시(서버가 아직 안 주는 경우)
                });

                const hasData = courses.length > 0;

                // ✅ “키워드 태그” 우선 (없으면 topic/subTopic fallback)
                const flatKeywords = courses
                  .flatMap((c) => (Array.isArray(c.keywords) ? c.keywords : []))
                  .filter(Boolean);

                const uniqueKeywords = Array.from(new Set(flatKeywords)).slice(0, 2);
                const extraCount = Math.max(0, flatKeywords.length - uniqueKeywords.length);

                // fallback tag (기존 topic/subTopic)
                const topicPairs = courses.filter((c) => c?.topic || c?.subTopic).slice(0, 1);

                return (
                  <div
                    key={idx}
                    className={styles.dayCell}
                    onClick={() => {
                      if (!hasData) return;
                      nav(`/mypage/log?date=${encodeURIComponent(iso)}`);
                    }}
                    style={{ cursor: hasData ? "pointer" : "default" }}
                    aria-disabled={!hasData}
                  >
                    <div className={`${styles.dayNumber} ${isToday ? styles.today : ""}`}>
                      {day}
                    </div>

                    {(uniqueKeywords.length > 0 ||
                      extraCount > 0 ||
                      topicPairs.length > 0) && (
                      <div className={styles.tag}>
                        <div className={styles.tagLine}>
                          {uniqueKeywords.length > 0 ? (
                            uniqueKeywords.map((k, i) => (
                              <span key={`${k}-${i}`} className={styles.tagChunk}>
                                <span className={styles.tagWeak}>#{k}</span>
                                {i !== uniqueKeywords.length - 1 ? (
                                  <span className={styles.tagSlash}> </span>
                                ) : null}
                              </span>
                            ))
                          ) : (
                            topicPairs.map((c, i) => (
                              <span key={i} className={styles.tagChunk}>
                                {c.topic ? <span className={styles.tagStrong}>{c.topic}</span> : null}
                                {c.subTopic ? <span className={styles.tagWeak}>#{c.subTopic}</span> : null}
                              </span>
                            ))
                          )}
                        </div>

                        {(extraCount > 0 || (courses.find((c) => typeof c.extra === "number")?.extra ?? 0) > 0) && (
                          <div className={styles.tagExtra}>
                            +{extraCount || (courses.find((c) => typeof c.extra === "number")?.extra ?? 0)}
                          </div>
                        )}
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

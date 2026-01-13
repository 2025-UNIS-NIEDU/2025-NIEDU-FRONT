// src/pages/MyPage/MyPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
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
  topic?: string; // 한글
  subTopic?: string; // 한글
  extra?: number; // { extra: 2 }
};

type CalendarDay = {
  date: string; // LocalDateTime (문서상)
  courses: CalendarCourse[];
};

type CalendarData = {
  year: number;
  month: number; // 1~12
  days: CalendarDay[];
};

type MeData = {
  nickname?: string;
  profileImageUrl?: string;
};

type StreakData = {
  streak?: number;
};

const toISODate = (y: number, m0: number, d: number) => {
  const mm = String(m0 + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
};

export default function MyPage() {
  const nav = useNavigate();

  // ---------- today ----------
  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth0 = today.getMonth(); // 0~11
  const todayDate = today.getDate();

  // ---------- profile (local upload preview) ----------
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // ---------- user ----------
  const [nickname, setNickname] = useState("사용자 님");
  const [streak, setStreak] = useState<number | null>(null);
  const [serverProfileUrl, setServerProfileUrl] = useState<string | null>(null);

  // ---------- calendar state ----------
  const [year, setYear] = useState(todayYear);
  const [month0, setMonth0] = useState(todayMonth0);

  // ---------- API states ----------
  const [navData, setNavData] = useState<DateNavigatorData | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);

  const [loadingNav, setLoadingNav] = useState(true);
  const [loadingCal, setLoadingCal] = useState(true);

  // 사용자/출석은 캘린더와 별도 로딩으로 관리
  const [loadingUser, setLoadingUser] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // helpers
  const monthForApi = month0 + 1; // 1~12

  // ✅ (0) 유저 프로필 + 출석 streak
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

        if (typeof st?.streak === "number") setStreak(st.streak);
      } catch (e) {
        console.error("[MyPage] user/streak error:", e);
      } finally {
        setLoadingUser(false);
      }
    };

    void run();
  }, []);

  // ✅ (1) 날짜 내비게이터: 최초 진입 시 현재 년/월 세팅
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

  // ✅ (2) 캘린더: year/month 바뀔 때마다 호출
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

  // ---------- local calendar grid ----------
  const firstDay = new Date(year, month0, 1).getDay();
  const lastDate = new Date(year, month0 + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);
  for (let d = 1; d <= lastDate; d++) daysArray.push(d);

  // ---------- calendar day -> courses map ----------
  const dayToCourses = useMemo(() => {
    const map = new Map<number, CalendarCourse[]>();
    const days = calendarData?.days ?? [];

    for (const item of days) {
      const dt = new Date(item.date);

      const dayNum = Number.isNaN(dt.getTime())
        ? Number(String(item.date).slice(8, 10))
        : dt.getDate();

      if (!Number.isNaN(dayNum)) {
        map.set(dayNum, Array.isArray(item.courses) ? item.courses : []);
      }
    }
    return map;
  }, [calendarData]);

  // ---------- month navigation ----------
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

  // ---------- profile upload ----------
  const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setProfileImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ---------- UI helpers ----------
  const isThisMonthToday = month0 === todayMonth0 && year === todayYear;
  const shownProfileImg = profileImage ?? serverProfileUrl;

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
            <img src="/icons/Ellipse 25.svg" alt="프로필 프레임" className={styles.profileFrame} />

            {shownProfileImg && <img src={shownProfileImg} alt="프로필" className={styles.profilePhoto} />}

            <label className={styles.profileUploadButton}>
              +
              <input
                type="file"
                accept="image/*"
                className={styles.profileUploadInput}
                onChange={handleProfileChange}
              />
            </label>
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
          onKeyDown={(e) => {
            if (e.key === "Enter") nav("/mypage/terms");
          }}
        >
          <img src="/icons/majesticons_book.svg" alt="" className={styles.sectionIcon} />
          <span>용어 사전</span>
        </div>

        {/* 복습 노트 (아이콘 img 자리 포함) */}
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

                const courses = dayToCourses.get(day) ?? [];
                const hasData = courses.length > 0;

                const topicPairs = courses.filter((c) => c?.topic || c?.subTopic).slice(0, 2);
                const extraObj = courses.find((c) => typeof c?.extra === "number");
                const extraCount = typeof extraObj?.extra === "number" ? extraObj.extra : 0;

                const iso = toISODate(year, month0, day);

                return (
                  <div
                    key={idx}
                    className={styles.dayCell}
                    onClick={() => {
                      if (!hasData) return;
                      // ✅ 캘린더 클릭 → 학습 로그로
                      nav(`/mypage/log?date=${encodeURIComponent(iso)}`);
                    }}
                    style={{ cursor: hasData ? "pointer" : "default" }}
                    aria-disabled={!hasData}
                  >
                    <div className={`${styles.dayNumber} ${isToday ? styles.today : ""}`}>{day}</div>

                    {(topicPairs.length > 0 || extraCount > 0) && (
                      <div className={styles.tag}>
                        <div className={styles.tagLine}>
                          {topicPairs.map((c, i) => (
                            <span key={i} className={styles.tagChunk}>
                              {c.topic ? <span className={styles.tagStrong}>{c.topic}</span> : null}
                              {c.subTopic ? <span className={styles.tagWeak}>#{c.subTopic}</span> : null}
                              {i !== topicPairs.length - 1 ? <span className={styles.tagSlash}> / </span> : null}
                            </span>
                          ))}
                        </div>

                        {extraCount > 0 && <div className={styles.tagExtra}>+{extraCount}</div>}
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

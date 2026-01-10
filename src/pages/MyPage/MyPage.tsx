// src/pages/MyPage/MyPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
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
  extra?: number; // { extra: 2 } 이런 식으로 올 수 있음
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

export default function MyPage() {
  // ---------- today ----------
  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth0 = today.getMonth(); // 0~11 (UI용)
  const todayDate = today.getDate();

  // ---------- profile (local upload preview) ----------
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // ---------- calendar state (UI는 0~11로 유지) ----------
  const [year, setYear] = useState(todayYear);
  const [month0, setMonth0] = useState(todayMonth0); // 0=1월

  // ---------- API states ----------
  const [navData, setNavData] = useState<DateNavigatorData | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loadingNav, setLoadingNav] = useState(true);
  const [loadingCal, setLoadingCal] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---------- helpers ----------
  const monthForApi = month0 + 1; // 1~12

  // ✅ (1) 날짜 내비게이터: 최초 진입 시 현재 년/월 세팅
  useEffect(() => {
    const run = async () => {
      setLoadingNav(true);
      setErrorMsg(null);
      try {
        const res = await api.get<ApiResponse<DateNavigatorData>>(
          "/api/my/date-navigator"
        );
        const d = res.data?.data;
        if (d?.currentYear && d?.currentMonth) {
          setNavData(d);
          // API 기준으로 UI year/month 동기화
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

  // ---------- calendar day -> tags map ----------
  const dayToCourses = useMemo(() => {
    const map = new Map<number, CalendarCourse[]>();
    const days = calendarData?.days ?? [];

    for (const item of days) {
      const dt = new Date(item.date);
      // 혹시 date 파싱이 깨질 때 대비 (문자열 형태가 다를 수 있음)
      const dayNum = Number.isNaN(dt.getTime())
        ? Number(String(item.date).slice(8, 10)) // "YYYY-MM-DD..." 케이스 fallback
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

  // ---------- UI ----------
  const isThisMonthToday = month0 === todayMonth0 && year === todayYear;

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 상단 타이틀 + 설정 버튼 */}
        <div className={styles.topBar}>
          <h1 className={styles.title}>마이페이지</h1>
          <button type="button" className={styles.settingsButton}>
            <img
              src="/icons/icon-settings.svg"
              alt=""
              className={styles.settingsIcon}
            />
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

            {profileImage && (
              <img
                src={profileImage}
                alt="프로필"
                className={styles.profilePhoto}
              />
            )}

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
            {/* TODO: 프로필/출석 streak API 문서가 없어서 일단 유지 */}
            <p className={styles.name}>이화연 님</p>
            <p className={styles.streak}>
              {loadingNav ? "출석 정보를 불러오는 중..." : "2일 연속 출석하셨어요!"}
            </p>
          </div>
        </div>

        {/* 용어 사전 섹션 타이틀 */}
        <div className={styles.sectionTitle}>
          <img
            src="/icons/majesticons_book.svg"
            alt=""
            className={styles.sectionIcon}
          />
          <span>용어 사전</span>
        </div>

        {/* 달력 전체 박스 */}
        <div className={styles.calendarBox}>
          <div className={styles.monthHeader}>
            <button
              className={styles.monthArrow}
              type="button"
              onClick={handlePrevMonth}
            >
              <img
                src="/icons/Polygon 4.svg"
                alt="이전 달"
                className={`${styles.monthArrowIcon} ${styles.monthArrowLeft}`}
              />
            </button>

            <span className={styles.monthLabel}>
              {year}년 {month0 + 1}월
            </span>

            <button
              className={styles.monthArrow}
              type="button"
              onClick={handleNextMonth}
            >
              <img
                src="/icons/Polygon 4.svg"
                alt="다음 달"
                className={styles.monthArrowIcon}
              />
            </button>
          </div>

          {loadingCal && !calendarData ? (
            <p style={{ padding: 12, opacity: 0.7 }}>캘린더 불러오는 중...</p>
          ) : (
            <div className={styles.grid}>
              {daysArray.map((day, idx) => {
                if (day === null)
                  return <div key={idx} className={styles.emptyCell} />;

                const isToday = isThisMonthToday && day === todayDate;

                const courses = dayToCourses.get(day) ?? [];
                // topic/subTopic 최대 2개 + extra(추가 n개) 문서 규칙 반영
                const topicPairs = courses
                  .filter((c) => c?.topic || c?.subTopic)
                  .slice(0, 2);

                const extraObj = courses.find(
                  (c) => typeof c?.extra === "number"
                );
                const extraCount =
                  typeof extraObj?.extra === "number" ? extraObj.extra : 0;

                return (
                  <div key={idx} className={styles.dayCell}>
                    <div
                      className={`${styles.dayNumber} ${
                        isToday ? styles.today : ""
                      }`}
                    >
                      {day}
                    </div>

                    {(topicPairs.length > 0 || extraCount > 0) && (
                      <div className={styles.tag}>
                        {topicPairs.map((c, i) => (
                          <div key={i}>
                            {c.topic && (
                              <span className={styles.tagStrong}>
                                {c.topic}
                              </span>
                            )}
                            {c.subTopic && (
                              <span className={styles.tagWeak}>
                                #{c.subTopic}
                              </span>
                            )}
                          </div>
                        ))}

                        {extraCount > 0 && (
                          <div style={{ marginTop: 2, opacity: 0.85 }}>
                            +{extraCount}
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

        {/* (선택) 디버그로 range 확인하고 싶으면 켜도 됨 */}
        {/* {navData && (
          <pre style={{ fontSize: 10, opacity: 0.6 }}>
            {JSON.stringify(navData, null, 2)}
          </pre>
        )} */}
      </div>

      <BottomNav activeTab="mypage" />
    </div>
  );
}

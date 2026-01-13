// src/pages/Home/Home.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import NewsCard from "../onboarding/components/NewsCard/NewsCard";
import { useGoToDetail } from "@/hooks/useGoToDetail";

import type { ApiResponse } from "@/types/api";
import api from "@/api/axiosInstance";

// /api/user/me
type UserProfile = {
  nickname: string;
  profileImageUrl: string;
};

// /api/attendance/streak
type StreakData = {
  streak: number;
  todayAttended: boolean;
};

// /api/home/news
type HomeNewsItem = {
  newsId: number;
  courseId?: number;
  title: string;
  imageUrl?: string;
  keywords: string[];
  source: string;
  publishedAt: string;
};

// /api/home/courses
type HomeCourse = {
  courseId: number;
  title: string;
  thumbnailUrl?: string;
  progressRate: number;
  isSaved: boolean;
};

const FALLBACK_USER: UserProfile = { nickname: "사용자", profileImageUrl: "" };
const FALLBACK_THUMB = "/icons/vite.svg";

/** ✅ data가 배열이든, data.courses/items/content/list 형태든 다 뽑아오기 */
const pickArray = (d: any): any[] => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.courses)) return d.courses;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.content)) return d.content;
  if (Array.isArray(d?.list)) return d.list;
  if (Array.isArray(d?.result)) return d.result;
  if (Array.isArray(d?.data)) return d.data; // 혹시 중첩된 케이스
  return [];
};

/** ✅ 어떤 형태로 오든 courseId를 확보하기 위한 정규화 */
const normalizeCourse = (x: any): HomeCourse => {
  const courseId = Number(
    x?.courseId ??
      x?.id ??
      x?.courseID ??
      x?.course_id ??
      x?.coursePk ??
      x?.courseNo ??
      0
  );

  return {
    courseId,
    title: String(x?.title ?? x?.name ?? x?.headline ?? ""),
    thumbnailUrl: String(x?.thumbnailUrl ?? x?.thumbnail ?? x?.imageUrl ?? ""),
    progressRate: Number(
      x?.progressRate ?? x?.progress ?? x?.completionRate ?? x?.progressPercent ?? 0
    ),
    isSaved: Boolean(x?.isSaved ?? x?.saved ?? x?.bookmarked ?? false),
  };
};

/** ✅ 오늘자 뉴스도 어떤 키로 오든 흡수해서 쓰기 (courseId / imageUrl 문제 해결) */
const normalizeNews = (x: any): HomeNewsItem => {
  const newsId = Number(x?.newsId ?? x?.id ?? x?.news_id ?? 0);

  const courseId = Number(
    x?.courseId ??
      x?.course_id ??
      x?.courseID ??
      x?.coursePk ??
      x?.courseNo ??
      x?.course?.courseId ??
      x?.course?.id ??
      x?.course?.course_id ??
      0
  );

  const keywordsRaw = x?.keywords ?? x?.tags ?? x?.keywordList ?? x?.keyWords ?? [];
  const keywords = Array.isArray(keywordsRaw) ? keywordsRaw.map(String) : [];

  return {
    newsId,
    courseId: courseId || undefined,
    title: String(x?.title ?? x?.headline ?? x?.name ?? ""),
    imageUrl:
      String(
        x?.imageUrl ??
          x?.thumbnailUrl ??
          x?.thumbnail ??
          x?.newsImageUrl ??
          x?.imgUrl ??
          x?.image ??
          ""
      ) || undefined,
    keywords,
    source: String(x?.source ?? x?.publisher ?? x?.press ?? ""),
    publishedAt: String(x?.publishedAt ?? x?.date ?? x?.createdAt ?? ""),
  };
};

export default function Home() {
  const navigate = useNavigate();
  const goToDetail = useGoToDetail();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

  const [todayNews, setTodayNews] = useState<HomeNewsItem[]>([]);
  const [recentCourses, setRecentCourses] = useState<HomeCourse[]>([]);
  const [savedCourses, setSavedCourses] = useState<HomeCourse[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    const res = await api.get<ApiResponse<UserProfile>>("/api/user/me");
    if (res.data?.success && res.data?.data) setUser(res.data.data);
    else setUser(FALLBACK_USER);
  };

  const fetchStreak = async () => {
    const res = await api.get<ApiResponse<StreakData>>("/api/attendance/streak");
    if (res.data?.success && res.data?.data) setStreak(res.data.data.streak);
    else setStreak(null);
  };

  const fetchTodayNews = async () => {
    const res = await api.get<ApiResponse<any>>("/api/home/news");
    const raw = pickArray(res.data?.data);

    console.log("[home news] raw:", raw);

    if (res.data?.success && Array.isArray(raw)) {
      const mapped = raw.map(normalizeNews).filter((n) => n.newsId > 0);
      console.log("[home news] mapped:", mapped);
      setTodayNews(mapped);
    } else {
      setTodayNews([]);
    }
  };

  const fetchHomeCourses = async () => {
    const [recentRes, savedRes] = await Promise.all([
      api.get<ApiResponse<any>>("/api/home/courses", {
        params: { type: "recent", view: "preview" },
      }),
      api.get<ApiResponse<any>>("/api/home/courses", {
        params: { type: "saved", view: "preview" },
      }),
    ]);

    const rawRecent = pickArray(recentRes.data?.data);
    const rawSaved = pickArray(savedRes.data?.data);

    console.log("[home courses] recent raw:", rawRecent);
    console.log("[home courses] saved raw:", rawSaved);

    setRecentCourses(rawRecent.map(normalizeCourse).filter((c) => c.courseId > 0));
    setSavedCourses(rawSaved.map(normalizeCourse).filter((c) => c.courseId > 0));
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        await Promise.all([fetchUserProfile(), fetchStreak(), fetchTodayNews(), fetchHomeCourses()]);
        if (!alive) return;
      } catch (e) {
        console.error("[HOME] load error:", e);
        if (!alive) return;

        setUser(FALLBACK_USER);
        setStreak(null);
        setTodayNews([]);
        setRecentCourses([]);
        setSavedCourses([]);
        setErrorMsg("홈 데이터를 불러오지 못했어요. (로그인/쿠키/서버 상태 확인)");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.src.endsWith(FALLBACK_THUMB)) return;
    img.src = FALLBACK_THUMB;
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 헤더 */}
        <header className={styles.header}>
          <h1 className={styles.title}>홈</h1>
          <div className={styles.firebox}>
            <div className={styles.fireIcon}>
              <img src="/icons/solar_fire-bold-duotone11.svg" alt="streak" />
              <span>{streak ?? "-"}</span>
            </div>
          </div>
        </header>

        {/* 출석 배너 */}
        <div className={styles.banner}>
          <div className={styles.bannerContent}>
            <img
              src="/icons/solar_fire-bold-duotone.svg"
              alt="fire"
              className={styles.bannerIcon}
            />
            <p className={styles.bannerText}>
              {user?.nickname ?? "사용자"} 님, 오늘도 뉴스로 시야를 넓혀봐요!
            </p>
          </div>
        </div>

        {/* 상태 표시 */}
        {loading && (
          <div style={{ padding: "12px 0", fontSize: 12, opacity: 0.7 }}>
            홈 데이터 불러오는 중…
          </div>
        )}
        {!loading && errorMsg && (
          <div style={{ padding: "12px 0", fontSize: 12, color: "#d33" }}>{errorMsg}</div>
        )}

        {/* 오늘자 뉴스 학습하기 */}
        <section className={styles.section}>
          <h2>오늘자 뉴스 학습하기</h2>
          <p className={styles.date}>오전 8시 업데이트</p>

          <div className={styles.newsScroll}>
            {todayNews.length === 0 && !loading ? (
              <div style={{ fontSize: 12, opacity: 0.7, padding: "8px 0" }}>오늘자 뉴스가 없어요.</div>
            ) : (
              todayNews.map((news) => {
                const courseId = news.courseId;

                return (
                  <button
                    key={news.newsId}
                    className={`${styles.newsItem} ${styles.clickable}`}
                    type="button"
                    onClick={() => {
                      if (!courseId) {
                        alert("이 뉴스는 연결된 코스 ID가 없어 상세로 이동할 수 없어요.");
                        return;
                      }
                      goToDetail(courseId, { from: "home-today" });
                    }}
                  >
                    <NewsCard title={news.title} source={news.source} imageUrl={news.imageUrl} />
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* 최근 학습한 코스 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>최근 학습한 코스</h2>
            <img
              src="/icons/ep_arrow-up-bold.svg"
              alt="arrow"
              className={styles.arrow}
              onClick={() => navigate("/recent-courses")}
            />
          </div>

          {recentCourses.length === 0 && !loading ? (
            <div style={{ fontSize: 12, opacity: 0.7, padding: "8px 0" }}>
              최근 학습한 코스가 없어요.
            </div>
          ) : (
            recentCourses.map((course) => (
              <button
                key={course.courseId}
                type="button"
                className={`${styles.courseCard} ${styles.clickable}`}
                onClick={() => goToDetail(course.courseId, { from: "home-recent" })}
              >
                <img
                  className={styles.courseThumb}
                  src={course.thumbnailUrl || FALLBACK_THUMB}
                  onError={handleImgError}
                  alt=""
                />
                <div className={styles.courseBody}>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.courseDesc}>진행률 {course.progressRate ?? 0}%</p>
                  <div className={styles.tagRow}>
                    {course.isSaved && <span className={styles.tag}>저장됨</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </section>

        {/* 즐겨찾기 코스 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>즐겨찾기한 코스</h2>
            <img
              src="/icons/ep_arrow-up-bold.svg"
              alt="arrow"
              className={styles.arrow}
              onClick={() => navigate("/saved-courses")}
            />
          </div>

          {savedCourses.length === 0 && !loading ? (
            <div style={{ fontSize: 12, opacity: 0.7, padding: "8px 0" }}>
              즐겨찾기한 코스가 없어요.
            </div>
          ) : (
            savedCourses.map((course) => (
              <button
                key={course.courseId}
                type="button"
                className={`${styles.courseCard} ${styles.clickable}`}
                onClick={() => goToDetail(course.courseId, { from: "home-saved" })}
              >
                <img
                  className={styles.courseThumb}
                  src={course.thumbnailUrl || FALLBACK_THUMB}
                  onError={handleImgError}
                  alt=""
                />
                <div className={styles.courseBody}>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.courseDesc}>진행률 {course.progressRate ?? 0}%</p>
                  <div className={styles.tagRow}>
                    {course.isSaved && <span className={styles.tag}>저장됨</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </section>

        <BottomNav />
      </div>
    </div>
  );
}

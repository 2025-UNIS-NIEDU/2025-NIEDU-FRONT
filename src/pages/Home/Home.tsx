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
  progressRate?: number;
  topic?: string;
  keywords?: string[];
  isSaved: boolean;
};

const FALLBACK_USER: UserProfile = { nickname: "사용자", profileImageUrl: "" };
const FALLBACK_THUMB = "/icons/vite.svg";
const SAVED_DIRTY_KEY = "niedu_saved_courses_dirty";

const pickArray = (d: any): any[] => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.courses)) return d.courses;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.content)) return d.content;
  if (Array.isArray(d?.list)) return d.list;
  if (Array.isArray(d?.result)) return d.result;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

const formatHash = (s: string) => {
  const t = String(s ?? "").trim();
  if (!t) return "";
  return t.startsWith("#") ? t : `#${t}`;
};

const normalizeCourse = (x: any): HomeCourse => {
  const courseId = Number(x?.courseId ?? x?.id ?? x?.courseID ?? x?.course_id ?? x?.coursePk ?? x?.courseNo ?? 0);
  const rawKeywords = x?.keywords ?? x?.subTopics ?? x?.tags ?? x?.keywordList ?? [];
  const keywords = Array.isArray(rawKeywords) ? rawKeywords.map(String) : [];

  return {
    courseId,
    title: String(x?.title ?? x?.name ?? x?.headline ?? ""),
    thumbnailUrl: String(x?.thumbnailUrl ?? x?.thumbnail ?? x?.imageUrl ?? ""),
    progressRate: Number(x?.progressRate ?? x?.progress ?? x?.completionRate ?? x?.progressPercent ?? 0),
    topic: String(x?.topic ?? x?.mainTopic ?? x?.category ?? ""),
    keywords,
    isSaved: Boolean(x?.isSaved ?? x?.saved ?? x?.bookmarked ?? false),
  };
};

const normalizeNews = (x: any): HomeNewsItem => {
  const newsId = Number(x?.newsId ?? x?.id ?? x?.news_id ?? 0);

  let courseId = Number(
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

  if ((!courseId || Number.isNaN(courseId)) && newsId) courseId = newsId;

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

    if (res.data?.success && Array.isArray(raw)) {
      setTodayNews(raw.map(normalizeNews).filter((n) => n.newsId > 0));
    } else {
      setTodayNews([]);
    }
  };

  const fetchHomeCourses = async () => {
    const [recentRes, savedRes] = await Promise.all([
      api.get<ApiResponse<any>>("/api/home/courses", { params: { type: "recent", view: "preview" } }),
      api.get<ApiResponse<any>>("/api/home/courses", { params: { type: "saved", view: "preview" } }),
    ]);

    const rawRecent = pickArray(recentRes.data?.data);
    const rawSaved = pickArray(savedRes.data?.data);

    setRecentCourses(rawRecent.map(normalizeCourse).filter((c) => c.courseId > 0));
    setSavedCourses(rawSaved.map(normalizeCourse).filter((c) => c.courseId > 0));
  };

  const fetchSavedCoursesOnly = async () => {
    try {
      const savedRes = await api.get<ApiResponse<any>>("/api/home/courses", {
        params: { type: "saved", view: "preview" },
      });
      const rawSaved = pickArray(savedRes.data?.data);
      if (savedRes.data?.success && Array.isArray(rawSaved)) {
        setSavedCourses(rawSaved.map(normalizeCourse).filter((c) => c.courseId > 0));
      } else {
        setSavedCourses([]);
      }
    } catch (e) {
      console.error("[HOME] fetchSavedCoursesOnly error:", e);
    }
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

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SAVED_DIRTY_KEY) void fetchSavedCoursesOnly();
    };
    const onFocus = () => void fetchSavedCoursesOnly();
    const onVis = () => {
      if (document.visibilityState === "visible") void fetchSavedCoursesOnly();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoDetail = (courseId?: number) => {
    if (!courseId) return;
    goToDetail(courseId, { from: "home" });
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>홈</h1>

          <div className={styles.firebox}>
            <div className={styles.fireIcon}>
              <img src="/icons/solar_fire-bold-duotone.svg" alt="fire" />
              <span>{streak ?? 0}</span>
            </div>
          </div>
        </div>

        <div className={styles.banner}>
          <div className={styles.bannerContent}>
            <img
              src="/icons/solar_fire-bold-duotone.svg"
              alt="fire"
              className={styles.bannerIcon}
            />
            <p className={styles.bannerText}>
              {user?.nickname ?? "사용자"} 님, 오늘도 뉴스로 상식을 넓혀봐요!
            </p>
          </div>
        </div>

        {loading && (
          <div style={{ padding: "12px 0", fontSize: 12, opacity: 0.7 }}>
            홈 데이터 불러오는 중…
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: "12px 0", fontSize: 12, color: "#b91c1c" }}>
            {errorMsg}
          </div>
        )}

        {/* 오늘자 뉴스 학습하기 */}
        <section>
          <div style={{ marginTop: 22 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              오늘자 뉴스 학습하기
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: 12, opacity: 0.7 }}>
              25.10.01. 8시 업데이트
            </p>
          </div>

          <div className={styles.newsScroll}>
            {todayNews.slice(0, 6).map((n) => (
              <div key={n.newsId} className={styles.newsItem} onClick={() => handleGoDetail(n.courseId)}>
                <NewsCard title={n.title} source={n.source} imageUrl={n.imageUrl} />
              </div>
            ))}
          </div>
        </section>

        {/* 최근 학습한 코스 */}
        <section style={{ marginTop: 26 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>최근 학습한 코스</h2>
            <img className={styles.arrow} src="/icons/ep_arrow-up-bold.svg" alt="more" />
          </div>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {recentCourses.slice(0, 2).map((c) => (
              <div
                key={c.courseId}
                className={styles.courseCard}
                onClick={() => handleGoDetail(c.courseId)}
              >
                <img
                  className={styles.courseThumb}
                  src={c.thumbnailUrl || FALLBACK_THUMB}
                  alt=""
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_THUMB;
                  }}
                />
                <div className={styles.courseBody}>
                  <p className={styles.courseTitle}>{c.title}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(c.keywords ?? []).slice(0, 2).map((k) => (
                      <span key={k} style={{ fontSize: 12, color: "#3b82f6" }}>
                        {formatHash(k)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 즐겨찾기한 코스 */}
        <section style={{ marginTop: 26 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>즐겨찾기한 코스</h2>
            <img className={styles.arrow} src="/icons/ep_arrow-up-bold.svg" alt="more" />
          </div>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {savedCourses.slice(0, 3).map((c) => (
              <div
                key={c.courseId}
                className={styles.courseCard}
                onClick={() => handleGoDetail(c.courseId)}
              >
                <img
                  className={styles.courseThumb}
                  src={c.thumbnailUrl || FALLBACK_THUMB}
                  alt=""
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_THUMB;
                  }}
                />
                <div className={styles.courseBody}>
                  <p className={styles.courseTitle}>{c.title}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(c.keywords ?? []).slice(0, 2).map((k) => (
                      <span key={k} style={{ fontSize: 12, color: "#3b82f6" }}>
                        {formatHash(k)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.bottomSpace} />
        <BottomNav activeTab="home" />
      </div>
    </div>
  );
}

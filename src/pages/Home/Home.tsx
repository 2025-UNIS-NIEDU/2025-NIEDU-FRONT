// src/pages/Home/Home.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import NewsCard from "../onboarding/components/NewsCard/NewsCard";
import { useGoToDetail } from "@/hooks/useGoToDetail";

import type { ApiResponse } from "@/types/api";
import api from "@/api/axiosInstance";

type UserProfile = {
  nickname: string;
  profileImageUrl: string;
};

type StreakData = {
  streak: number;
  todayAttended: boolean;
};

type HomeNewsItem = {
  newsId: number;
  courseId?: number;
  title: string;
  imageUrl?: string;
  keywords: string[];
  source: string;
  publishedAt: string;
};

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

  const fetchSavedCourses = async () => {
    const savedRes = await api.get<ApiResponse<any>>("/api/home/courses", { params: { type: "saved", view: "preview" } });
    const rawSaved = pickArray(savedRes.data?.data);
    setSavedCourses(rawSaved.map(normalizeCourse).filter((c) => c.courseId > 0));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SAVED_DIRTY_KEY) void fetchSavedCourses();
    };

    const onFocus = () => void fetchSavedCourses();

    const onVis = () => {
      if (document.visibilityState === "visible") void fetchSavedCourses();
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

  if (loading && !user) return <div className={styles.viewport}>로딩 중...</div>;

  const displayName = user?.nickname ?? FALLBACK_USER.nickname;
  const avatar = user?.profileImageUrl ?? FALLBACK_USER.profileImageUrl;

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

        <header className={styles.header}>
          <div className={styles.left}>
            <div className={styles.avatar}>
              {avatar ? <img src={avatar} alt="" /> : <div className={styles.avatarFallback} />}
            </div>
            <div className={styles.hello}>
              <div className={styles.name}>{displayName}</div>
              <div className={styles.sub}>
                {streak !== null ? (
                  <>
                    <span className={styles.badge}>{streak}일</span> 연속 학습 중!
                  </>
                ) : (
                  "오늘도 학습해볼까요?"
                )}
              </div>
            </div>
          </div>

          <button className={styles.mypageBtn} onClick={() => navigate("/mypage")}>
            마이페이지
          </button>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h2>오늘의 뉴스 학습하기</h2>
          </div>

          <div className={styles.newsRow}>
            {todayNews.length === 0 && !loading ? (
              <div className={styles.emptyCard}>오늘의 뉴스가 없어요.</div>
            ) : (
              todayNews.slice(0, 3).map((n) => (
                <div
                  key={n.newsId}
                  onClick={() => n.courseId && goToDetail(n.courseId, { from: "home-news" })}
                  style={{ cursor: n.courseId ? "pointer" : "default" }}
                >
                  <NewsCard title={n.title} source={n.source} imageUrl={n.imageUrl} />
                </div>
              ))
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h2>최근 학습한 코스</h2>
            <button className={styles.moreBtn} onClick={() => navigate("/recent-courses")}>
              더보기
            </button>
          </div>

          <div className={styles.courseGrid}>
            {recentCourses.length === 0 && !loading ? (
              <div className={styles.emptyCard}>최근 학습한 코스가 없어요.</div>
            ) : (
              recentCourses.slice(0, 4).map((course) => (
                <button
                  key={course.courseId}
                  className={styles.courseCard}
                  onClick={() => goToDetail(course.courseId, { from: "home-recent" })}
                  type="button"
                >
                  <img
                    className={styles.thumb}
                    src={course.thumbnailUrl || FALLBACK_THUMB}
                    alt=""
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_THUMB;
                    }}
                  />
                  <div className={styles.courseInfo}>
                    <p className={styles.courseTitle}>{course.title}</p>
                    <div className={styles.hashRow}>
                      {(course.keywords ?? []).slice(0, 3).map((k) => (
                        <span key={k} className={styles.hash}>
                          {formatHash(k)}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h2>즐겨찾기한 코스</h2>
            <button className={styles.moreBtn} onClick={() => navigate("/saved-courses")}>
              더보기
            </button>
          </div>

          {savedCourses.length === 0 && !loading ? (
            <div className={styles.emptyCard}>즐겨찾기한 코스가 없어요.</div>
          ) : (
            <div className={styles.courseGrid}>
              {savedCourses.slice(0, 4).map((course) => (
                <button
                  key={course.courseId}
                  className={styles.courseCard}
                  onClick={() => goToDetail(course.courseId, { from: "home-saved" })}
                  type="button"
                >
                  <img
                    className={styles.thumb}
                    src={course.thumbnailUrl || FALLBACK_THUMB}
                    alt=""
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_THUMB;
                    }}
                  />
                  <div className={styles.courseInfo}>
                    <p className={styles.courseTitle}>{course.title}</p>
                    <div className={styles.hashRow}>
                      {(course.keywords ?? []).slice(0, 3).map((k) => (
                        <span key={k} className={styles.hash}>
                          {formatHash(k)}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <div className={styles.bottomSpace} />
        <BottomNav activeTab="home" />
      </div>
    </div>
  );
}

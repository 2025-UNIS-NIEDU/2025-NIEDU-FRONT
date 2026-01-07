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

export default function Home() {
  const navigate = useNavigate();
  const goToDetail = useGoToDetail();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

  const [todayNews, setTodayNews] = useState<HomeNewsItem[]>([]);
  const [recentCourses, setRecentCourses] = useState<HomeCourse[]>([]);
  const [savedCourses, setSavedCourses] = useState<HomeCourse[]>([]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get<ApiResponse<UserProfile>>("/api/user/me");
      if (res.data.success) setUser(res.data.data);
      else setUser(FALLBACK_USER);
    } catch (e) {
      console.error("[HOME] fetchUserProfile error:", e);
      setUser(FALLBACK_USER);
    }
  };

  const fetchStreak = async () => {
    try {
      const res = await api.get<ApiResponse<StreakData>>("/api/attendance/streak");
      if (res.data.success && res.data.data) setStreak(res.data.data.streak);
      else setStreak(null);
    } catch (e) {
      console.error("[HOME] fetchStreak error:", e);
      setStreak(null);
    }
  };

  const fetchTodayNews = async () => {
    try {
      const res = await api.get<ApiResponse<HomeNewsItem[]>>("/api/home/news");
      if (res.data.success && Array.isArray(res.data.data)) setTodayNews(res.data.data);
      else setTodayNews([]);
    } catch (e) {
      console.error("[HOME] fetchTodayNews error:", e);
      setTodayNews([]);
    }
  };

  const fetchHomeCourses = async () => {
    try {
      const recentRes = await api.get<ApiResponse<HomeCourse[]>>("/api/home/courses", {
        params: { type: "recent", view: "preview" },
      });
      setRecentCourses(Array.isArray(recentRes.data.data) ? recentRes.data.data : []);

      const savedRes = await api.get<ApiResponse<HomeCourse[]>>("/api/home/courses", {
        params: { type: "saved", view: "preview" },
      });
      setSavedCourses(Array.isArray(savedRes.data.data) ? savedRes.data.data : []);
    } catch (e) {
      console.error("[HOME] fetchHomeCourses error:", e);
      setRecentCourses([]);
      setSavedCourses([]);
    }
  };

  useEffect(() => {
    void fetchUserProfile();
    void fetchStreak();
    void fetchTodayNews();
    void fetchHomeCourses();
  }, []);

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
              {user?.nickname ?? "사용자"} 님, 오늘도 뉴스로 상식을 넓혀봐요!
            </p>
          </div>
        </div>

        {/* 오늘자 뉴스 학습하기 */}
        <section className={styles.section}>
          <h2>오늘자 뉴스 학습하기</h2>
          <p className={styles.date}>오전 8시 업데이트</p>

          <div className={styles.newsScroll}>
            {todayNews.map((news) => (
              <button
                key={news.newsId}
                className={`${styles.newsItem} ${styles.clickable}`}
                onClick={() => goToDetail(news.newsId, { from: "home-today" })}
              >
                <NewsCard title={news.title} source={news.source} />
              </button>
            ))}
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

          {recentCourses.map((course) => (
            <div
              key={course.courseId}
              className={`${styles.courseCard} ${styles.clickable}`}
              onClick={() => goToDetail(course.courseId, { from: "home-recent" })}
            >
              <img
                className={styles.courseThumb}
                src={course.thumbnailUrl ?? "/sample-news.png"}
                alt=""
              />
              <div className={styles.courseBody}>
                <h3 className={styles.courseTitle}>{course.title}</h3>
                <p className={styles.courseDesc}>진행률 {course.progressRate}%</p>
                <div className={styles.tagRow}>
                  {course.isSaved && <span className={styles.tag}>저장됨</span>}
                </div>
              </div>
            </div>
          ))}
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

          {savedCourses.map((course) => (
            <div
              key={course.courseId}
              className={`${styles.courseCard} ${styles.clickable}`}
              onClick={() => goToDetail(course.courseId, { from: "home-saved" })}
            >
              <img
                className={styles.courseThumb}
                src={course.thumbnailUrl ?? "/sample-news.png"}
                alt=""
              />
              <div className={styles.courseBody}>
                <h3 className={styles.courseTitle}>{course.title}</h3>
                <p className={styles.courseDesc}>진행률 {course.progressRate}%</p>
                <div className={styles.tagRow}>
                  {course.isSaved && <span className={styles.tag}>저장됨</span>}
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className={styles.bottomSpace} />
        <BottomNav />
      </div>
    </div>
  );
}

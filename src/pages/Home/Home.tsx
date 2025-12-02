// src/pages/Home/Home.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import NewsCard from "../onboarding/components/NewsCard/NewsCard";
import { useGoToPrepare } from "@/hooks/useGoToPrepare";
import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse, TodayNewsItem } from "@/types/api";
import api from "@/api/axiosInstance";

// 🔹 /api/user/me 응답 타입
type UserProfile = {
  nickname: string;
  profileImageUrl: string;
};

export default function Home() {
  const navigate = useNavigate();
  const goToPrepare = useGoToPrepare();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [todayNews, setTodayNews] = useState<TodayNewsItem[] | null>(null);
  const [recentCourses, setRecentCourses] = useState<any[] | null>(null);
  const [savedCourses, setSavedCourses] = useState<any[] | null>(null);

  // 🔹 회원 정보 조회 (/api/user/me)
  const fetchUserProfile = async () => {
    try {
      const res = await api.get<ApiResponse<UserProfile>>("/api/user/me");

      console.log("user me:", res.data);

      if (res.data.success) {
        setUser(res.data.data);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("fetchUserProfile error:", e);
      setUser(null);
    }
  };

  // 🔥 출석 스트릭
  const fetchStreak = async () => {
    try {
      const res = (await apiFetch(
        "/api/attendance/streak"
      )) as ApiResponse<number>;

      console.log("streak res:", res);

      if (res.success) {
        setStreak(res.data); // data가 숫자라고 가정
      } else {
        setStreak(null);
      }
    } catch (e) {
      console.error(e);
      setStreak(null);
    }
  };

  // 🔥 오늘자 뉴스
  const fetchTodayNews = async () => {
    try {
      const res = (await apiFetch("/api/home/news")) as ApiResponse<
        TodayNewsItem[]
      >;

      console.log("todayNews res:", res);

      if (res.success && Array.isArray(res.data)) {
        setTodayNews(res.data);
      } else {
        setTodayNews([]);
      }
    } catch (e) {
      console.error(e);
      setTodayNews([]);
    }
  };

  // 🔥 최근 코스
  const fetchRecentCourses = async () => {
    try {
      const res = (await apiFetch(
        "/api/home/courses?type=recent&view=preview"
      )) as ApiResponse<any[]>;

      console.log("recentCourses res:", res);

      if (res.success && Array.isArray(res.data)) {
        setRecentCourses(res.data);
      } else {
        setRecentCourses([]);
      }
    } catch (e) {
      console.error(e);
      setRecentCourses([]);
    }
  };

  // 🔥 즐겨찾기 코스
  const fetchSavedCourses = async () => {
    try {
      const res = (await apiFetch(
        "/api/home/courses?type=saved&view=preview"
      )) as ApiResponse<any[]>;

      console.log("savedCourses res:", res);

      if (res.success && Array.isArray(res.data)) {
        setSavedCourses(res.data);
      } else {
        setSavedCourses([]);
      }
    } catch (e) {
      console.error(e);
      setSavedCourses([]);
    }
  };

  // ✅ useEffect는 "함수들 정의 후"에 위치해야 함
  useEffect(() => {
    void fetchUserProfile();
    void fetchStreak();
    void fetchTodayNews();
    void fetchRecentCourses();
    void fetchSavedCourses();
  }, []);

  // 🔐 map 안전장치
  const todayNewsList = Array.isArray(todayNews) ? todayNews : [];
  const recentCourseList = Array.isArray(recentCourses) ? recentCourses : [];
  const savedCourseList = Array.isArray(savedCourses) ? savedCourses : [];

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 헤더 */}
        <header className={styles.header}>
          <h1 className={styles.title}>홈</h1>
          <div className={styles.fireIcon}>
            <img src="/solar_fire-bold-duotone11.svg" alt="streak" />
            <span>{streak ?? "-"}</span>
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
              {/* 🔹 하드코딩 이름 → API에서 가져온 닉네임으로 변경 */}
              {user?.nickname ?? "회원"} 님,{" "}
              <span>{streak ?? "-"}일 연속 출석</span>하셨어요!
            </p>
          </div>
        </div>

        {/* 오늘자 뉴스 학습하기 */}
        <section className={styles.section}>
          <h2>오늘자 뉴스 학습하기</h2>
          <p className={styles.date}>25.10.01. 8시 업데이트</p>

          <div className={styles.newsScroll}>
            {todayNewsList.map((news, idx) => (
              <button
                key={idx}
                className={`${styles.newsItem} ${styles.clickable}`}
                onClick={() => goToPrepare(news.title, { from: "home-today" })}
              >
                <NewsCard title={news.title} source={news.publisher} />
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

          {recentCourseList.map((course) => (
            <div
              key={course.id ?? course.title}
              className={`${styles.courseCard} ${styles.clickable}`}
              onClick={() =>
                goToPrepare(course.id ?? course.title, { from: "home-recent" })
              }
            >
              <img
                className={styles.courseThumb}
                src={course.thumbnailUrl ?? "/sample-news.png"}
                alt=""
              />
              <div className={styles.courseBody}>
                <h3 className={styles.courseTitle}>{course.title}</h3>
                <div className={styles.tagRow}>
                  {(course.tags ?? []).map((t: string, i: number) => (
                    <span key={i} className={styles.tag}>
                      {t}
                    </span>
                  ))}
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

          {savedCourseList.map((course) => (
            <div
              key={course.id ?? course.title}
              className={`${styles.courseCard} ${styles.clickable}`}
              onClick={() =>
                goToPrepare(course.id ?? course.title, { from: "home-saved" })
              }
            >
              <img
                className={styles.courseThumb}
                src={course.thumbnailUrl ?? "/sample-news.png"}
                alt=""
              />
              <div className={styles.courseBody}>
                <h3 className={styles.courseTitle}>{course.title}</h3>
                <div className={styles.tagRow}>
                  {(course.tags ?? []).map((t: string, i: number) => (
                    <span key={i} className={styles.tag}>
                      {t}
                    </span>
                  ))}
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

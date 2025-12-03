// src/pages/Home/Home.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import NewsCard from "../onboarding/components/NewsCard/NewsCard";
import { useGoToDetail } from "@/hooks/useGoToDetail";

import type { ApiResponse } from "@/types/api";
import api from "@/api/axiosInstance";
import { getCourses } from "@/lib/mockCourseApi";

// 🔹 dev / prod 구분 (Vite)
const IS_DEV = import.meta.env.DEV;

// 🔹 /api/user/me 응답 타입
type UserProfile = {
  nickname: string;
  profileImageUrl: string;
};

// 🔹 /api/attendance/streak 응답 data
type StreakData = {
  streak: number;
};

// 🔹 /api/home/news 응답 data 아이템
type TodayNewsItem = {
  thumbnailUrl: string;
  title: string;
  publisher: string;
  topic: string | null;
};

// 🔹 홈에서 쓰는 코스 타입 (mockCourseApi 기준)
type HomeCourse = {
  id?: number;
  courseId?: number;
  thumbnailUrl: string;
  title: string;
  description: string;
  topic: string | null;
  subTopic?: string | null;
};

// 공통 id 추출
const getCourseId = (c: HomeCourse) => c.courseId ?? c.id;

// ⭐ 배포용 오늘자 뉴스 더미
const MOCK_TODAY_NEWS: TodayNewsItem[] = [
  {
    thumbnailUrl: "/sample-news.png",
    title: "국민연금과 환율, 협력의 경제학",
    publisher: "NIEdu Lab",
    topic: "경제",
  },
  {
    thumbnailUrl: "/sample-news.png",
    title: "환율 변동 속, 국민연금 해외투자 이슈",
    publisher: "NIEdu Lab",
    topic: "경제",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const goToDetail = useGoToDetail();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [todayNews, setTodayNews] = useState<TodayNewsItem[] | null>(null);
  const [recentCourses, setRecentCourses] = useState<HomeCourse[] | null>(null);
  const [savedCourses, setSavedCourses] = useState<HomeCourse[] | null>(null);

  // 🔹 회원 정보 조회
  const fetchUserProfile = async () => {
    // ⭐ 배포(Vercel)에서는 더미로만 세팅
    if (!IS_DEV) {
      setUser({
        nickname: "이화연",
        profileImageUrl: "",
      });
      return;
    }

    try {
      const res = await api.get<ApiResponse<UserProfile>>("/api/user/me");
      console.log("[HOME] user me:", res.data);

      if (res.data.success) {
        setUser(res.data.data);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("[HOME] fetchUserProfile error:", e);
      setUser(null);
    }
  };

  // 🔥 출석 스트릭
  const fetchStreak = async () => {
    // ⭐ 배포에서는 네트워크 호출 없이 더미 값
    if (!IS_DEV) {
      setStreak(2);
      return;
    }

    try {
      const res = await api.get<ApiResponse<StreakData>>(
        "/api/attendance/streak"
      );
      console.log("[HOME] streak res:", res.data);

      if (res.data.success && res.data.data) {
        setStreak(res.data.data.streak);
      } else {
        setStreak(null);
      }
    } catch (e) {
      console.error("[HOME] fetchStreak error:", e);
      setStreak(null);
    }
  };

  // 🔥 오늘자 뉴스
  const fetchTodayNews = async () => {
    // ⭐ 배포에서는 더미 뉴스 사용
    if (!IS_DEV) {
      setTodayNews(MOCK_TODAY_NEWS);
      return;
    }

    try {
      const res = await api.get<ApiResponse<TodayNewsItem[]>>(
        "/api/home/news"
      );
      console.log("[HOME] todayNews res:", res.data);

      if (res.data.success && Array.isArray(res.data.data)) {
        setTodayNews(res.data.data);
      } else {
        setTodayNews([]);
      }
    } catch (e) {
      console.error("[HOME] fetchTodayNews error:", e);
      setTodayNews([]);
    }
  };

  // 🔥 최근 코스 (mock 사용)
  const fetchRecentCourses = async () => {
    try {
      const data = (await getCourses({
        type: "recent",
        view: "preview",
      })) as HomeCourse[];
      console.log("[HOME] recentCourses (mock) res:", data);
      setRecentCourses(data);
    } catch (e) {
      console.error("[HOME] fetchRecentCourses (mock) error:", e);
      setRecentCourses([]);
    }
  };

  // 🔥 즐겨찾기 코스 (mock 사용 – custom)
  const fetchSavedCourses = async () => {
    try {
      const data = (await getCourses({
        type: "custom",
        view: "preview",
      })) as HomeCourse[];
      console.log("[HOME] savedCourses (mock) res:", data);
      setSavedCourses(data);
    } catch (e) {
      console.error("[HOME] fetchSavedCourses (mock) error:", e);
      setSavedCourses([]);
    }
  };

  // ✅ 마운트 시 호출
  useEffect(() => {
    void fetchUserProfile();
    void fetchStreak();
    void fetchTodayNews();
    void fetchRecentCourses();
    void fetchSavedCourses();
  }, []);

  const todayNewsList = Array.isArray(todayNews) ? todayNews : [];
  const recentCourseList = Array.isArray(recentCourses) ? recentCourses : [];
  const savedCourseList = Array.isArray(savedCourses) ? savedCourses : [];

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 헤더 */}
        <header className={styles.header}>
          <h1 className={styles.title}>홈</h1>
          <div className={styles.firebox}>
            <div className={styles.fireIcon}>
              <img
                src="/icons/solar_fire-bold-duotone11.svg"
                alt="streak"
              />
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
              {user?.nickname ?? "이화연"} 님, 오늘도 뉴스로 상식을 넓혀봐요!
            </p>
          </div>
        </div>

        {/* 오늘자 뉴스 학습하기 */}
        <section className={styles.section}>
          <h2>오늘자 뉴스 학습하기</h2>
          <p className={styles.date}>25.12.03. 8시 업데이트</p>

          <div className={styles.newsScroll}>
            {todayNewsList.map((news, idx) => (
              <button
                key={news.title + idx}
                className={`${styles.newsItem} ${styles.clickable}`}
                onClick={() =>
                  goToDetail(news.title, { from: "home-today" })
                }
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

          {recentCourseList.map((course) => {
            const id = getCourseId(course);
            return (
              <div
                key={id ?? course.title}
                className={`${styles.courseCard} ${styles.clickable}`}
                onClick={() => {
                  if (id == null) {
                    console.warn("[HOME] recent course id 없음", course);
                    return;
                  }
                  goToDetail(String(id), { from: "home-recent" });
                }}
              >
                <img
                  className={styles.courseThumb}
                  src={course.thumbnailUrl ?? "/sample-news.png"}
                  alt=""
                />
                <div className={styles.courseBody}>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.courseDesc}>{course.description}</p>
                  <div className={styles.tagRow}>
                    {course.topic && (
                      <span className={styles.tag}>{course.topic}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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

          {savedCourseList.map((course) => {
            const id = getCourseId(course);
            return (
              <div
                key={id ?? course.title}
                className={`${styles.courseCard} ${styles.clickable}`}
                onClick={() => {
                  if (id == null) {
                    console.warn("[HOME] saved course id 없음", course);
                    return;
                  }
                  goToDetail(String(id), { from: "home-saved" });
                }}
              >
                <img
                  className={styles.courseThumb}
                  src={course.thumbnailUrl ?? "/sample-news.png"}
                  alt=""
                />
                <div className={styles.courseBody}>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.courseDesc}>{course.description}</p>
                  <div className={styles.tagRow}>
                    {course.topic && (
                      <span className={styles.tag}>{course.topic}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <div className={styles.bottomSpace} />
        <BottomNav />
      </div>
    </div>
  );
}

// src/pages/Home/RecentCourses.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./RecentCourses.module.css";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import { useGoToDetail } from "@/hooks/useGoToDetail";

type HomeCourse = {
  courseId: number;
  title: string;
  thumbnailUrl?: string;
  progressRate: number;
  isSaved: boolean;
};

export default function RecentCourses() {
  const navigate = useNavigate();
  const goToDetail = useGoToDetail();
  const [courses, setCourses] = useState<HomeCourse[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get<ApiResponse<HomeCourse[]>>("/api/home/courses", {
          params: { type: "recent", view: "all" },
        });
        setCourses(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (e) {
        console.error("[RecentCourses] fetch error:", e);
        setCourses([]);
      }
    };
    void run();
  }, []);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <header className={styles.header}>
          <img
            src="/icons/ep_arrow-up-bold.svg"
            alt="back"
            className={styles.backArrow}
            onClick={() => navigate(-1)}
          />
          <h1 className={styles.title}>최근 학습한 코스</h1>
        </header>

        <main className={styles.list}>
          {courses.map((c) => (
            <button
              key={c.courseId}
              type="button"
              className={styles.item}
              onClick={() => goToDetail(c.courseId, { from: "recent-list" })}
            >
              <img
                src={c.thumbnailUrl || "/sample-news.png"}
                alt={c.title}
                className={styles.thumb}
              />
              <div className={styles.body}>
                <h2 className={styles.itemTitle}>{c.title}</h2>
                <div className={styles.tagRow}>
                  <span className={styles.tag}>진행률 {c.progressRate}%</span>
                  {c.isSaved && <span className={styles.tag}>저장됨</span>}
                </div>
              </div>
            </button>
          ))}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

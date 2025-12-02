import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SavedCourses.module.css";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";

type Course = {
  id: number;
  title: string;
  tags: string[];
  thumbnail?: string;
};

export default function RecentCourses() {
  const navigate = useNavigate();

  // ✅ API 자리: 나중에 fetch로 교체
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      title: "한-싱가포르 협력: 외교전 전환",
      tags: ["정치", "#외교"],
      thumbnail: "/sample-news.png",
    },
    {
      id: 2,
      title: "코스명",
      tags: ["토픽", "#서브토픽"],
      thumbnail: "/sample-news.png",
    },
    {
      id: 3,
      title: "코스명",
      tags: ["토픽", "#서브토픽"],
      thumbnail: "/sample-news.png",
    },
  ]);

  // 예시
  // useEffect(() => {
  //   fetch("/api/courses/recent") // 백엔드에서 최근학습한 코스 반환
  //     .then((r) => r.json())
  //     .then((data: Course[]) => setCourses(data))
  //     .catch(console.error);
  // }, []);

  return (
    <div className={styles.viewport}>
    <div className={styles.container}>
      {/* 상단 헤더 */}
      <header className={styles.header}>
        <img
          src="/icons/ep_arrow-up-bold.svg"
          alt="back"
          className={styles.backArrow}
          onClick={() => navigate(-1)}
        />
        <h1 className={styles.title}>즐겨찾기한 코스</h1>
      </header>

      {/* 리스트 */}
      <main className={styles.list}>
        {courses.map((c) => (
          <article key={c.id} className={styles.item}>
            <img
              src={c.thumbnail || "/sample-news.png"}
              alt={c.title}
              className={styles.thumb}
            />
            <div className={styles.body}>
              <h2 className={styles.itemTitle}>{c.title}</h2>
              <div className={styles.tagRow}>
                {c.tags.map((t, i) => (
                  <span key={i} className={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </main>

      <BottomNav />
    </div>
    </div>
  );
}

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
  topic?: string | null;
  subTopic?: string | null;
  keywords?: string[];
};

/** ✅ 응답이 뭐로 오든 courseId 확보 + 키워드/토픽 확보 */
const normalizeCourse = (x: any): HomeCourse | null => {
  const courseId = Number(
    x?.courseId ??
      x?.id ??
      x?.courseID ??
      x?.course_id ??
      x?.coursePk ??
      x?.courseNo ??
      0
  );
  const title = String(x?.title ?? x?.name ?? x?.headline ?? "");
  if (!courseId || !title) return null;

  const thumb = x?.thumbnailUrl ?? x?.thumbnail ?? x?.imageUrl ?? x?.thumbUrl;

  const rawKeywords = x?.keywords ?? x?.keywordList ?? x?.tags ?? x?.hashTags;
  const keywords = Array.isArray(rawKeywords)
    ? rawKeywords.map((k: any) => String(k)).filter(Boolean)
    : [];

  return {
    courseId,
    title,
    thumbnailUrl: thumb ? String(thumb) : undefined,
    progressRate: Number(
      x?.progressRate ?? x?.progress ?? x?.completionRate ?? x?.progressPercent ?? 0
    ),
    isSaved: Boolean(x?.isSaved ?? x?.saved ?? x?.bookmarked ?? false),
    topic: x?.topic ?? null,
    subTopic: x?.subTopic ?? null,
    keywords,
  };
};

export default function RecentCourses() {
  const navigate = useNavigate();
  const goToDetail = useGoToDetail();
  const [courses, setCourses] = useState<HomeCourse[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get<ApiResponse<any>>("/api/home/courses", {
          params: { type: "recent", view: "all" },
        });
        const raw = Array.isArray(res.data.data) ? res.data.data : [];
        setCourses(raw.map(normalizeCourse).filter(Boolean) as HomeCourse[]);
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

                {/* ✅ 진행률 대신: 토픽 + 키워드(서브토픽) */}
                <div className={styles.tagRow}>
                  <span className={styles.tag}>{c.topic || "토픽"}</span>

                  {(() => {
                    const kw =
                      c.subTopic ||
                      c.keywords?.[0] ||
                      c.keywords?.find(Boolean) ||
                      "서브토픽";
                    const label = kw.startsWith("#") ? kw : `#${kw}`;
                    return <span className={styles.tag}>{label}</span>;
                  })()}
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

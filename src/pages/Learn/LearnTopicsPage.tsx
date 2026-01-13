// src/pages/Learn/LearnTopicsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import page from "./LearnListPage.module.css";
import styles from "./Learn.module.css";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import { useGoToDetail } from "@/hooks/useGoToDetail";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

type Category = "정치" | "경제" | "사회" | "국제";
const CATEGORIES: Category[] = ["정치", "경제", "사회", "국제"];
const FALLBACK_THUMB = "/sample-news.png";

type ApiCourse = {
  courseId: number;
  thumbnailUrl?: string;
  title: string;
  topic?: string | null;
  subTopic?: string | null;
};

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

const normalizeCourse = (x: any): ApiCourse | null => {
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

  return {
    courseId,
    title,
    thumbnailUrl: thumb ? String(thumb) : undefined,
    topic: x?.topic ?? null,
    subTopic: x?.subTopic ?? null,
  };
};

export default function LearnTopicsPage() {
  const navigate = useNavigate();
  const goToDetail = useGoToDetail();

  const [active, setActive] = useState<Category>("정치");
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErrorMsg(null);

    (async () => {
      try {
        const res = await api.get<ApiResponse<any>>("/api/edu/courses", {
          params: {
            type: "RECENT",
            view: "ALL",
            topic: active,
          },
        });

        const raw = pickArray(res.data?.data);
        const mapped = raw.map(normalizeCourse).filter(Boolean) as ApiCourse[];
        if (!alive) return;
        setCourses(mapped);
      } catch (e) {
        console.error("[LearnTopicsPage] fetch error:", e);
        if (!alive) return;
        setErrorMsg("최신 토픽별 세션을 불러오지 못했어요.");
        setCourses([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [active]);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.src.endsWith(FALLBACK_THUMB)) return;
    img.src = FALLBACK_THUMB;
  };

  const list = useMemo(() => courses, [courses]);

  return (
    <div className={page.viewport}>
      <div className={page.container}>
        <header className={page.header}>
          <img
            src="/icons/ep_arrow-up-bold.svg"
            alt="back"
            className={page.backArrow}
            onClick={() => navigate(-1)}
          />
          <h1 className={page.title}>최신 토픽별 세션</h1>
        </header>

        {errorMsg && <p className={page.errorMsg}>{errorMsg}</p>}

        <section className={styles.section}>
          <div className={styles.chips}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.chip} ${active === cat ? styles.chipActive : ""}`}
                onClick={() => setActive(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className={styles.verticalList}>
            {loading && list.length === 0 ? (
              <p className={page.loading}>불러오는 중...</p>
            ) : list.length === 0 ? (
              <p className={page.loading} style={{ opacity: 0.7 }}>
                표시할 코스가 없어요.
              </p>
            ) : (
              list.map((c) => (
                <div
                  key={c.courseId}
                  className={styles.courseRow}
                  onClick={() => goToDetail(String(c.courseId), { from: "learn-topics" })}
                >
                  <img
                    src={c.thumbnailUrl ?? FALLBACK_THUMB}
                    onError={handleImgError}
                    alt=""
                    className={styles.rowThumb}
                  />
                  <div className={styles.rowBody}>
                    <h3 className={styles.rowTitle}>{c.title}</h3>
                    <p className={styles.rowSub}>
                      {c.topic ?? active} · {c.subTopic ?? ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <BottomNav />
      </div>
    </div>
  );
}

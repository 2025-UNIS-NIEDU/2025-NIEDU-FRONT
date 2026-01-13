// src/pages/Learn/Learn.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Learn.module.css";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import { useGoToDetail } from "@/hooks/useGoToDetail";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

export type Category = "정치" | "경제" | "사회" | "국제";

// ✅ 문서 기준: topic은 "정치/경제/사회/국제"
const TOPIC_QUERY_MAP: Record<Category, string | undefined> = {
  정치: "정치",
  경제: "경제",
  사회: "사회",
  국제: "국제",
};

export type ApiCourse = {
  courseId: number;
  thumbnailUrl?: string;
  title: string;
  longDescription?: string | null;
  topic?: string | null;
  subTopic?: string | null;
};

export const CATEGORIES: Category[] = ["정치", "경제", "사회", "국제"];

const FALLBACK_THUMB = "/sample-news.png";

/** ✅ data가 배열이든, data.courses/items/content/list 형태든 다 뽑아오기 */
const pickArray = (d: any): any[] => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.courses)) return d.courses;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.content)) return d.content;
  if (Array.isArray(d?.list)) return d.list;
  if (Array.isArray(d?.result)) return d.result;
  if (Array.isArray(d?.data)) return d.data; // 혹시 중첩
  return [];
};

// ✅ 응답이 뭐로 오든 courseId 확보 + title 확보
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
    longDescription:
      x?.longDescription === null || x?.longDescription === undefined
        ? null
        : String(x.longDescription),
    topic: x?.topic ?? null,
    subTopic: x?.subTopic ?? null,
  };
};

export default function Learn() {
  const navigate = useNavigate();
  const goToDetail = useGoToDetail();

  const [active, setActive] = useState<Category>("정치");

  const [latestByTopic, setLatestByTopic] = useState<ApiCourse[]>([]);
  const [popular, setPopular] = useState<ApiCourse[]>([]);
  const [personalized, setPersonalized] = useState<ApiCourse[]>([]);
  const [news, setNews] = useState<ApiCourse[]>([]);

  const [loadingLatest, setLoadingLatest] = useState(false);
  const [loadingOthers, setLoadingOthers] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ 최신 토픽별 세션 (type=RECENT, view=PREVIEW, topic=선택)
  useEffect(() => {
    const topicParam = TOPIC_QUERY_MAP[active];

    let alive = true;
    setLoadingLatest(true);
    setErrorMsg(null);

    (async () => {
      try {
        const res = await api.get<ApiResponse<any>>("/api/edu/courses", {
          params: {
            type: "RECENT",
            view: "PREVIEW",
            ...(topicParam ? { topic: topicParam } : {}),
          },
        });

        const raw = pickArray(res.data?.data);
        const mapped = raw.map(normalizeCourse).filter(Boolean) as ApiCourse[];
        if (!alive) return;
        setLatestByTopic(mapped);
      } catch (e) {
        console.error("[Learn] latestByTopic error:", e);
        if (!alive) return;
        setErrorMsg("최신 토픽별 세션을 불러오지 못했어요.");
        setLatestByTopic([]);
      } finally {
        if (!alive) return;
        setLoadingLatest(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [active]);

  // ✅ 인기/맞춤/새로운 (type=POPULAR/CUSTOM/NEW, view=PREVIEW)
  useEffect(() => {
    let alive = true;

    setLoadingOthers(true);
    setErrorMsg(null);

    (async () => {
      try {
        const [popRes, cusRes, newRes] = await Promise.all([
          api.get<ApiResponse<any>>("/api/edu/courses", {
            params: { type: "POPULAR", view: "PREVIEW" },
          }),
          api.get<ApiResponse<any>>("/api/edu/courses", {
            params: { type: "CUSTOM", view: "PREVIEW" },
          }),
          api.get<ApiResponse<any>>("/api/edu/courses", {
            params: { type: "NEW", view: "PREVIEW" },
          }),
        ]);

        const popRaw = pickArray(popRes.data?.data);
        const cusRaw = pickArray(cusRes.data?.data);
        const newRaw = pickArray(newRes.data?.data);

        if (!alive) return;

        setPopular(popRaw.map(normalizeCourse).filter(Boolean) as ApiCourse[]);
        setPersonalized(cusRaw.map(normalizeCourse).filter(Boolean) as ApiCourse[]);
        setNews(newRaw.map(normalizeCourse).filter(Boolean) as ApiCourse[]);
      } catch (e) {
        console.error("[Learn] others error:", e);
        if (!alive) return;

        setErrorMsg("코스 리스트를 불러오지 못했어요.");
        setPopular([]);
        setPersonalized([]);
        setNews([]);
      } finally {
        if (!alive) return;
        setLoadingOthers(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const latest3 = useMemo(() => latestByTopic.slice(0, 3), [latestByTopic]);

  const popularPreview = useMemo(() => popular.slice(0, 4), [popular]);
  const personalizedPreview = useMemo(() => personalized.slice(0, 4), [personalized]);
  const newPreview = useMemo(() => news.slice(0, 4), [news]);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.src.endsWith(FALLBACK_THUMB)) return;
    img.src = FALLBACK_THUMB;
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 상단 헤더 */}
        <header className={styles.header}>
          <h1 className={styles.title}>학습</h1>

          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.searchButton}
              onClick={() => navigate("/learn/search")}
            >
              <img
                src="/icons/iconamoon_search-bold.svg"
                alt="검색"
                className={styles.searchIcon}
              />
              <span>검색</span>
            </button>
          </div>
        </header>

        {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

        {/* 최신 토픽별 세션 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>최신 토픽별 세션</h2>
            <img
              src="/icons/ep_arrow-up-bold.svg"
              alt="더 보기"
              className={styles.arrowW}
              onClick={() => navigate("/learn/topics")}
            />
          </div>

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
            {loadingLatest && latest3.length === 0 ? (
              <p className={styles.loading}>불러오는 중...</p>
            ) : latest3.length === 0 ? (
              <p className={styles.loading} style={{ opacity: 0.7 }}>
                표시할 코스가 없어요.
              </p>
            ) : (
              latest3.map((c) => (
                <div
                  key={c.courseId}
                  className={styles.courseRow}
                  onClick={() => goToDetail(String(c.courseId), { from: "learn-latest" })}
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
                      {c.topic ?? "NIEdu Lab"} {c.subTopic ? `· ${c.subTopic}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 인기 코스 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>인기 코스</h2>
            <img
              src="/icons/ep_arrow-up-bold.svg"
              alt="더 보기"
              className={styles.arrow}
              onClick={() => navigate("/learn/popular")}
            />
          </div>

          <div className={styles.cardGrid}>
            {loadingOthers && popularPreview.length === 0 ? (
              <p className={styles.loading}>불러오는 중...</p>
            ) : popularPreview.length === 0 ? (
              <p className={styles.loading} style={{ opacity: 0.7 }}>
                표시할 코스가 없어요.
              </p>
            ) : (
              popularPreview.map((c) => (
                <div
                  key={c.courseId}
                  className={styles.courseCard}
                  onClick={() => goToDetail(String(c.courseId), { from: "learn-popular" })}
                >
                  <img
                    src={c.thumbnailUrl ?? FALLBACK_THUMB}
                    onError={handleImgError}
                    alt=""
                    className={styles.cardThumb}
                  />
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{c.title}</h3>
                    <p className={styles.cardSub}>{c.topic ?? "NIEdu"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 맞춤추천 코스 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>맞춤추천 코스</h2>
            <img
              src="/icons/ep_arrow-up-bold.svg"
              alt="더 보기"
              className={styles.arrow}
              onClick={() => navigate("/learn/personalized")}
            />
          </div>

          <div className={styles.cardGrid}>
            {loadingOthers && personalizedPreview.length === 0 ? (
              <p className={styles.loading}>불러오는 중...</p>
            ) : personalizedPreview.length === 0 ? (
              <p className={styles.loading} style={{ opacity: 0.7 }}>
                표시할 코스가 없어요.
              </p>
            ) : (
              personalizedPreview.map((c) => (
                <div
                  key={c.courseId}
                  className={styles.courseCard}
                  onClick={() =>
                    goToDetail(String(c.courseId), { from: "learn-personalized" })
                  }
                >
                  <img
                    src={c.thumbnailUrl ?? FALLBACK_THUMB}
                    onError={handleImgError}
                    alt=""
                    className={styles.cardThumb}
                  />
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{c.title}</h3>
                    <p className={styles.cardSub}>{c.topic ?? "NIEdu"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 새로운 코스 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>새로운 코스</h2>
            <img
              src="/icons/ep_arrow-up-bold.svg"
              alt="더 보기"
              className={styles.arrow}
              onClick={() => navigate("/learn/new")}
            />
          </div>

          <div className={styles.cardGrid}>
            {loadingOthers && newPreview.length === 0 ? (
              <p className={styles.loading}>불러오는 중...</p>
            ) : newPreview.length === 0 ? (
              <p className={styles.loading} style={{ opacity: 0.7 }}>
                표시할 코스가 없어요.
              </p>
            ) : (
              newPreview.map((c) => (
                <div
                  key={c.courseId}
                  className={styles.courseCard}
                  onClick={() => goToDetail(String(c.courseId), { from: "learn-new" })}
                >
                  <img
                    src={c.thumbnailUrl ?? FALLBACK_THUMB}
                    onError={handleImgError}
                    alt=""
                    className={styles.cardThumb}
                  />
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{c.title}</h3>
                    <p className={styles.cardSub}>{c.topic ?? "NIEdu"}</p>
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

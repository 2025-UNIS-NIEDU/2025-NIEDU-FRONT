// src/pages/Learn/Learn.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Learn.module.css";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import { useGoToDetail } from "@/hooks/useGoToDetail";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

export type Category = "정치" | "경제" | "사회" | "문화";

// ✅ 문서 기준: topic은 "정치/경제/사회/국제" (문화 없음 → 국제로 매핑)
const TOPIC_QUERY_MAP: Record<Category, string | undefined> = {
  정치: "정치",
  경제: "경제",
  사회: "사회",
  문화: "국제",
};

export type ApiCourse = {
  courseId: number; // ✅ Learn에서 상세 진입에 필요
  thumbnailUrl?: string;
  title: string;
  longDescription?: string | null;
  topic?: string | null;
  subTopic?: string | null;
};

export const CATEGORIES: Category[] = ["정치", "경제", "사회", "문화"];

// ✅ 응답이 뭐로 오든 courseId 확보 (백이 courseId를 안 줄 가능성도 대비)
const normalizeCourse = (x: any): ApiCourse | null => {
  const courseId = Number(x?.courseId ?? x?.id ?? x?.courseID ?? 0);
  const title = String(x?.title ?? "");

  if (!courseId || !title) return null;

  return {
    courseId,
    title,
    thumbnailUrl: x?.thumbnailUrl ? String(x.thumbnailUrl) : undefined,
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

    setLoadingLatest(true);
    setErrorMsg(null);

    (async () => {
      try {
        const res = await api.get<ApiResponse<any[]>>("/api/edu/courses", {
          params: {
            type: "RECENT",
            view: "PREVIEW",
            ...(topicParam ? { topic: topicParam } : {}),
          },
        });

        const raw = Array.isArray(res.data?.data) ? res.data.data : [];
        const mapped = raw
          .map(normalizeCourse)
          .filter(Boolean) as ApiCourse[];

        setLatestByTopic(mapped);
      } catch (e) {
        console.error("[Learn] latestByTopic error:", e);
        setErrorMsg("최신 토픽별 세션을 불러오지 못했어요.");
        setLatestByTopic([]);
      } finally {
        setLoadingLatest(false);
      }
    })();
  }, [active]);

  // ✅ 인기/맞춤/새로운 (type=POPULAR/CUSTOM/NEW, view=PREVIEW)
  useEffect(() => {
    setLoadingOthers(true);
    setErrorMsg(null);

    (async () => {
      try {
        const [popRes, cusRes, newRes] = await Promise.all([
          api.get<ApiResponse<any[]>>("/api/edu/courses", {
            params: { type: "POPULAR", view: "PREVIEW" },
          }),
          api.get<ApiResponse<any[]>>("/api/edu/courses", {
            params: { type: "CUSTOM", view: "PREVIEW" },
          }),
          api.get<ApiResponse<any[]>>("/api/edu/courses", {
            params: { type: "NEW", view: "PREVIEW" },
          }),
        ]);

        const popRaw = Array.isArray(popRes.data?.data) ? popRes.data.data : [];
        const cusRaw = Array.isArray(cusRes.data?.data) ? cusRes.data.data : [];
        const newRaw = Array.isArray(newRes.data?.data) ? newRes.data.data : [];

        setPopular(popRaw.map(normalizeCourse).filter(Boolean) as ApiCourse[]);
        setPersonalized(
          cusRaw.map(normalizeCourse).filter(Boolean) as ApiCourse[]
        );
        setNews(newRaw.map(normalizeCourse).filter(Boolean) as ApiCourse[]);
      } catch (e) {
        console.error("[Learn] others error:", e);
        setErrorMsg("코스 리스트를 불러오지 못했어요.");
        setPopular([]);
        setPersonalized([]);
        setNews([]);
      } finally {
        setLoadingOthers(false);
      }
    })();
  }, []);

  const latest3 = useMemo(() => latestByTopic.slice(0, 3), [latestByTopic]);

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
                className={`${styles.chip} ${
                  active === cat ? styles.chipActive : ""
                }`}
                onClick={() => setActive(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className={styles.verticalList}>
            {loadingLatest && latest3.length === 0 ? (
              <p className={styles.loading}>불러오는 중...</p>
            ) : (
              latest3.map((c) => (
                <div
                  key={c.courseId}
                  className={styles.courseRow}
                  onClick={() =>
                    goToDetail(String(c.courseId), { from: "learn-latest" })
                  }
                >
                  <img
                    src={c.thumbnailUrl ?? "/sample-news.png"}
                    alt=""
                    className={styles.rowThumb}
                  />
                  <div className={styles.rowBody}>
                    <h3 className={styles.rowTitle}>{c.title}</h3>
                    <p className={styles.rowSub}>
                      {c.topic ?? "NIEdu Lab"} · {c.subTopic ?? ""}
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
              alt="arrow"
              className={styles.arrow}
              onClick={() => navigate("/learn/popular")}
            />
          </div>
          <div className={styles.hScroll}>
            {loadingOthers && popular.length === 0 ? (
              <p className={styles.loading}>불러오는 중...</p>
            ) : (
              popular.map((c) => (
                <div
                  key={c.courseId}
                  className={styles.hCard}
                  onClick={() =>
                    goToDetail(String(c.courseId), { from: "learn-popular" })
                  }
                >
                  <div className={styles.hThumbWrap}>
                    <img
                      src={c.thumbnailUrl ?? "/sample-news.png"}
                      alt=""
                      className={styles.hThumb}
                    />
                  </div>
                  <h3 className={styles.hTitle}>{c.title}</h3>
                  <p className={styles.hSub}>{c.topic ?? "코스"}</p>
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
              alt="arrow"
              className={styles.arrow}
              onClick={() => navigate("/learn/personalized")}
            />
          </div>
          <div className={styles.hScroll}>
            {loadingOthers && personalized.length === 0 ? (
              <p className={styles.loading}>불러오는 중...</p>
            ) : (
              personalized.map((c) => (
                <div
                  key={c.courseId}
                  className={styles.hCard}
                  onClick={() =>
                    goToDetail(String(c.courseId), {
                      from: "learn-personalized",
                    })
                  }
                >
                  <div className={styles.hThumbWrap}>
                    <img
                      src={c.thumbnailUrl ?? "/sample-news.png"}
                      alt=""
                      className={styles.hThumb}
                    />
                  </div>
                  <h3 className={styles.hTitle}>{c.title}</h3>
                  <p className={styles.hSub}>{c.topic ?? "코스"}</p>
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
              alt="arrow"
              className={styles.arrow}
              onClick={() => navigate("/learn/new")}
            />
          </div>
          <div className={styles.hScroll}>
            {loadingOthers && news.length === 0 ? (
              <p className={styles.loading}>불러오는 중...</p>
            ) : (
              news.map((c) => (
                <div
                  key={c.courseId}
                  className={styles.hCard}
                  onClick={() =>
                    goToDetail(String(c.courseId), { from: "learn-new" })
                  }
                >
                  <div className={styles.hThumbWrap}>
                    <img
                      src={c.thumbnailUrl ?? "/sample-news.png"}
                      alt=""
                      className={styles.hThumb}
                    />
                  </div>
                  <h3 className={styles.hTitle}>{c.title}</h3>
                  <p className={styles.hSub}>{c.topic ?? "코스"}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <div className={styles.bottomSpace} />
        <BottomNav />
      </div>
    </div>
  );
}

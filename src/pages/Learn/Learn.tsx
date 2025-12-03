// src/pages/Learn/Learn.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Learn.module.css";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import { useGoToDetail } from "@/hooks/useGoToDetail";
import { getCourses, type MockCourse } from "@/lib/mockCourseApi";

export type Category = "정치" | "경제" | "사회" | "문화";

// 서버에서 내려주는 코스 타입(백엔드 연동 시 그대로 재사용 예정)
export type ApiCourse = {
  id?: number;
  courseId?: number;
  thumbnailUrl: string;
  title: string;
  description?: string | null;
  topic?: string | null;
  subTopic?: string | null;
};

export const CATEGORIES: Category[] = ["정치", "경제", "사회", "문화"];

// 한글 카테고리 → 서버 topic 값 매핑
const TOPIC_QUERY_MAP: Record<Category, string> = {
  정치: "politics",
  경제: "economy",
  사회: "society",
  문화: "world", // 필요하면 "culture" 로 변경
};

// 🔹 mockCourseApi → ApiCourse 형태로 맞춰주는 헬퍼
const toApiCourse = (c: MockCourse): ApiCourse => ({
  id: c.id,
  courseId: c.courseId,
  thumbnailUrl: c.thumbnailUrl,
  title: c.title,
  description: c.description,
  topic: c.topic,
  subTopic: c.subTopic,
});

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

  // ✅ 선택된 토픽이 바뀔 때마다 "최신 토픽별 세션" – 지금은 mock 데이터에서만 가져옴
  useEffect(() => {
    const topicParam = TOPIC_QUERY_MAP[active];

    setLoadingLatest(true);
    setErrorMsg(null);

    try {
      const list = getCourses({
        type: "recent",
        view: "preview",
        topic: topicParam,
      });
      setLatestByTopic(list.slice(0, 3).map(toApiCourse));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err?.message ?? "최신 토픽별 세션 로딩 중 오류가 발생했어요."
      );
    } finally {
      setLoadingLatest(false);
    }
  }, [active]);

  // ✅ 인기 / 맞춤 / 새로운 코스 – 첫 마운트에 mock 데이터 한 번만 세팅
  useEffect(() => {
    setLoadingOthers(true);
    setErrorMsg(null);

    try {
      const popularData = getCourses({ type: "popular", view: "preview" });
      const customData = getCourses({ type: "custom", view: "preview" });
      const newData = getCourses({ type: "new", view: "preview" });

      setPopular(popularData.map(toApiCourse));
      setPersonalized(customData.map(toApiCourse));
      setNews(newData.map(toApiCourse));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message ?? "코스 리스트 로딩 중 오류가 발생했어요.");
    } finally {
      setLoadingOthers(false);
    }
  }, []);

  const latest3 = useMemo(() => latestByTopic.slice(0, 3), [latestByTopic]);

  // 공통으로 courseId 뽑는 유틸
  const getCourseId = (c: ApiCourse) => c.courseId ?? c.id;

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

        {/* 에러 메시지 */}
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

          {/* 카테고리 칩 */}
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

          {/* 세로 리스트 */}
          <div className={styles.verticalList}>
            {loadingLatest && latest3.length === 0 ? (
              <p className={styles.loading}>불러오는 중...</p>
            ) : (
              latest3.map((c) => {
                const id = getCourseId(c);
                return (
                  <div
                    key={id ?? c.title}
                    className={styles.courseRow}
                    onClick={() => {
                      if (id == null) {
                        console.warn("[Learn] courseId/id 없음", c);
                        return;
                      }
                      goToDetail(String(id), { from: "learn-latest" });
                    }}
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
                );
              })
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
              popular.map((c) => {
                const id = getCourseId(c);
                return (
                  <div
                    key={id ?? c.title}
                    className={styles.hCard}
                    onClick={() => {
                      if (id == null) {
                        console.warn("[Learn] courseId/id 없음", c);
                        return;
                      }
                      goToDetail(String(id), { from: "learn-popular" });
                    }}
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
                );
              })
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
              personalized.map((c) => {
                const id = getCourseId(c);
                return (
                  <div
                    key={id ?? c.title}
                    className={styles.hCard}
                    onClick={() => {
                      if (id == null) {
                        console.warn("[Learn] courseId/id 없음", c);
                        return;
                      }
                      goToDetail(String(id), { from: "learn-personalized" });
                    }}
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
                );
              })
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
              news.map((c) => {
                const id = getCourseId(c);
                return (
                  <div
                    key={id ?? c.title}
                    className={styles.hCard}
                    onClick={() => {
                      if (id == null) {
                        console.warn("[Learn] courseId/id 없음", c);
                        return;
                      }
                      goToDetail(String(id), { from: "learn-new" });
                    }}
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
                );
              })
            )}
          </div>
        </section>

        <div className={styles.bottomSpace} />
        <BottomNav />
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

import styles from "./LearnSearch.module.css";

type HistoryItem = {
  keywordId: number; // 삭제 시 logId로 사용
  keyword: string;
};

type CourseSearchItem = {
  courseId: number;
  topic?: string;
  title: string;
  thumbnailUrl?: string;
  publisher?: string;
  publishedAt?: string;
  shortDescription?: string;
};

type SortType = "recent" | "popular";

export default function LearnSearch() {
  const nav = useNavigate();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortType>("recent");
  const [page, setPage] = useState(0);
  const size = 20;

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<CourseSearchItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canSearch = useMemo(() => query.trim().length > 0, [query]);

  // -------------------------
  // API calls
  // -------------------------
  const fetchHistory = async () => {
    try {
      const res = await api.get<ApiResponse<unknown>>("/api/search/history");
      const raw = Array.isArray(res.data.data) ? res.data.data : [];

      const mapped: HistoryItem[] = raw
        .map((x: any) => ({
          // ✅ 백이 keywordId / logId / id 중 무엇으로 보내도 삭제에 쓸 숫자 id를 뽑아오게 함
          keywordId: Number(x?.keywordId ?? x?.logId ?? x?.id ?? 0),
          keyword: String(x?.keyword ?? x?.text ?? ""),
        }))
        .filter((x: HistoryItem) => x.keywordId && x.keyword);


      setHistory(mapped);
    } catch (e) {
      console.error("[search] history error:", e);
      setHistory([]);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await api.get<ApiResponse<unknown>>("/api/search/suggestions");
      const data = res.data.data;

      const arr = Array.isArray(data)
        ? data.map((v: any) => String(v))
        : ([] as string[]);

      setSuggestions(arr);
    } catch (e) {
      console.error("[search] suggestions error:", e);
      setSuggestions([]);
    }
  };

  const deleteHistoryItem = async (keywordId: number) => {
    try {
      await api.delete(`/api/search/history/${keywordId}`);
      await fetchHistory();
    } catch (e) {
      console.error("[search] delete history error:", e);
    }
  };

  const fetchCourses = async (nextPage = 0, keywordOverride?: string) => {
    const keyword = (keywordOverride ?? query).trim();
    if (!keyword) return;

    setLoading(true);
    setErr("");

    try {
      const res = await api.get<ApiResponse<unknown>>("/api/search/courses", {
        params: {
          sort,
          page: nextPage,
          size,
          keyword, // 백이 keyword 파라미터를 안 쓰면 무시될 뿐이라 넣어둠
        },
      });

      const raw = Array.isArray(res.data.data) ? res.data.data : [];
      const mapped: CourseSearchItem[] = raw
        .map((x: any) => ({
          courseId: Number(x?.courseId ?? x?.id ?? 0),
          topic: x?.topic ? String(x.topic) : undefined,
          title: String(x?.title ?? ""),
          thumbnailUrl: x?.thumbnailUrl ? String(x.thumbnailUrl) : undefined,
          publisher: x?.publisher ? String(x.publisher) : undefined,
          publishedAt: x?.publishedAt ? String(x.publishedAt) : undefined,
          shortDescription: x?.shortDescription
            ? String(x.shortDescription)
            : undefined,
        }))
        .filter((x: CourseSearchItem) => x.courseId && x.title);

      if (nextPage === 0) setResults(mapped);
      else setResults((prev) => [...prev, ...mapped]);

      setPage(nextPage);
    } catch (e) {
      console.error("[search] courses error:", e);
      setErr("검색 결과를 불러오지 못했어요.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // effects
  // -------------------------
  useEffect(() => {
    void fetchHistory();
    void fetchSuggestions();
  }, []);

  useEffect(() => {
    if (!canSearch) return;
    void fetchCourses(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // -------------------------
  // handlers
  // -------------------------
  const onSubmit = async () => {
    if (!canSearch) return;
    await fetchCourses(0);
    await fetchHistory();
  };

  const onClickSuggestion = async (s: string) => {
    setQuery(s);
    await fetchCourses(0, s);
    await fetchHistory();
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 헤더 */}
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => nav(-1)}>
            ←
          </button>
          <h1 className={styles.title}>검색</h1>
        </header>

        {/* 검색 입력 */}
        <div className={styles.searchBar}>
          <input
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="코스/뉴스를 검색해보세요"
            onKeyDown={(e) => {
              if (e.key === "Enter") void onSubmit();
            }}
          />
          <button
            className={styles.searchBtn}
            onClick={() => void onSubmit()}
            disabled={!canSearch || loading}
          >
            검색
          </button>
        </div>

        {/* 정렬 */}
        <div className={styles.sortRow}>
          <button
            className={`${styles.sortBtn} ${
              sort === "recent" ? styles.sortActive : ""
            }`}
            onClick={() => setSort("recent")}
          >
            최신순
          </button>
          <button
            className={`${styles.sortBtn} ${
              sort === "popular" ? styles.sortActive : ""
            }`}
            onClick={() => setSort("popular")}
          >
            인기순
          </button>
        </div>

        {/* 추천 검색어 */}
        {suggestions.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>추천 검색어</div>
            <div className={styles.chips}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  className={styles.chip}
                  onClick={() => void onClickSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 최근 검색어 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>최근 검색어</div>
          {history.length === 0 ? (
            <div className={styles.empty}>최근 검색어가 없어요.</div>
          ) : (
            <ul className={styles.historyList}>
              {history.map((h) => (
                <li key={h.keywordId} className={styles.historyItem}>
                  <button
                    className={styles.historyKeyword}
                    onClick={() => void onClickSuggestion(h.keyword)}
                  >
                    {h.keyword}
                  </button>
                  <button
                    className={styles.historyDelete}
                    onClick={() => void deleteHistoryItem(h.keywordId)}
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 검색 결과 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>검색 결과</div>

          {loading && <div className={styles.empty}>불러오는 중…</div>}
          {!loading && err && <div className={styles.error}>{err}</div>}

          {!loading && !err && results.length === 0 && canSearch && (
            <div className={styles.empty}>검색 결과가 없어요.</div>
          )}

          <div className={styles.results}>
            {results.map((c) => (
              <article
                key={c.courseId}
                className={styles.card}
                onClick={() => nav(`/course/${c.courseId}`)}
              >
                <img
                  className={styles.thumb}
                  src={c.thumbnailUrl ?? "/sample-news.png"}
                  alt=""
                />
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>{c.title}</div>
                  <div className={styles.cardMeta}>
                    {c.topic && <span>{c.topic}</span>}
                    {c.publisher && <span> · {c.publisher}</span>}
                  </div>
                  {c.shortDescription && (
                    <div className={styles.cardDesc}>{c.shortDescription}</div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* 더보기 */}
          {!loading && results.length >= size && canSearch && (
            <button
              className={styles.moreBtn}
              onClick={() => void fetchCourses(page + 1)}
            >
              더보기
            </button>
          )}
        </section>

        <div className={styles.bottomSpace} />
      </div>
    </div>
  );
}

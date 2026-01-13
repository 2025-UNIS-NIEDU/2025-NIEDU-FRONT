import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import { useGoToDetail } from "@/hooks/useGoToDetail";
import styles from "./LearnSearch.module.css";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";

type HistoryItem = {
  keywordId: number; // 삭제 시 logId로 사용
  keyword: string;
};

type CourseSearchItem = {
  courseId: number;
  topic?: string;
  title: string;
  thumbnailUrl?: string;
  isSaved?: boolean;
  // 서버에서 내려오면 활용 (없어도 됨)
  tags?: string[];
  headline?: string;
};

type SortKey = "recent" | "popular";

const FALLBACK_THUMB = "/sample-news.png";
const SIZE_RESULT = 20;
const SIZE_AUTOCOMPLETE = 8;

// 추천 토픽(임시) - 서버에서 토픽/서브토픽 내려주면 교체 가능
const TOPIC_CHIPS = ["정치", "경제", "사회", "국제", "외교", "복지", "법", "시사"] as const;

function uniq(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    const s = v.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export default function LearnSearch() {
  const nav = useNavigate();
  const goToDetail = useGoToDetail();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [popularSuggestions, setPopularSuggestions] = useState<string[]>([]); // 상위 5개 인기 검색어
  const [autoList, setAutoList] = useState<string[]>([]); // 입력 2자 이상 자동완성
  const [results, setResults] = useState<CourseSearchItem[]>([]);
  const [page, setPage] = useState(0);

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false); // 검색중 UI (피그마 3번째 스샷)
  const [err, setErr] = useState("");

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);
  const isTyping = useMemo(() => query.trim().length >= 2, [query]);

  // -------------------------
  // API calls
  // -------------------------
  const fetchHistory = async () => {
    try {
      const res = await api.get<ApiResponse<unknown>>("/api/search/history");
      const raw = Array.isArray(res.data.data) ? res.data.data : [];

      const mapped: HistoryItem[] = raw
        .map((x: any) => ({
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

  const deleteHistoryItem = async (keywordId: number) => {
    try {
      await api.delete(`/api/search/history/${keywordId}`);
      await fetchHistory();
    } catch (e) {
      console.error("[search] delete history error:", e);
    }
  };

  // ✅ 별도 자동완성 전용 API 없음 → 인기 검색어 5개 받아서 추천/보조로 사용
  const fetchPopularSuggestions = async () => {
    try {
      const res = await api.get<ApiResponse<unknown>>("/api/search/suggestions");
      const data = res.data.data;

      const arr = Array.isArray(data) ? data.map((v: any) => String(v)) : ([] as string[]);
      setPopularSuggestions(arr);
    } catch (e) {
      console.error("[search] suggestions error:", e);
      setPopularSuggestions([]);
    }
  };

  const fetchCourses = async (nextPage: number, keyword: string, nextSort?: SortKey) => {
    setLoading(true);
    setSearching(true);
    setErr("");

    try {
      const res = await api.get<ApiResponse<unknown>>("/api/edu/search/courses", {
        params: {
          sort: nextSort ?? sort, // ✅ recent / popular
          page: nextPage,
          size: SIZE_RESULT,
          keyword,
        },
      });

      const raw = Array.isArray(res.data.data) ? res.data.data : [];
      const mapped: CourseSearchItem[] = raw
        .map((x: any) => ({
          courseId: Number(x?.courseId ?? x?.id ?? 0),
          topic: x?.topic ? String(x.topic) : undefined,
          title: String(x?.title ?? x?.courseTitle ?? ""),
          thumbnailUrl: x?.thumbnailUrl ? String(x.thumbnailUrl) : undefined,
          isSaved: Boolean(x?.isSaved ?? x?.saved ?? x?.bookmarked ?? false),
          tags: Array.isArray(x?.tags) ? x.tags.map((t: any) => String(t)) : undefined,
          headline: x?.headline ? String(x.headline) : undefined,
        }))
        .filter((x: CourseSearchItem) => x.courseId && x.title);

      if (nextPage === 0) setResults(mapped);
      else setResults((prev) => [...prev, ...mapped]);

      setPage(nextPage);
    } catch (e) {
      console.error("[search] courses error:", e);
      setErr("검색 결과를 불러오지 못했어요.");
      setResults([]);
      setPage(0);
    } finally {
      setLoading(false);
      setTimeout(() => setSearching(false), 250);
    }
  };

  // ✅ 찜(저장) 토글
  // - saved 코스는 /api/edu/courses?type=saved 로 조회 중
  // - 저장 토글 엔드포인트는 백엔드 구현에 따라 다를 수 있어서 몇 가지 후보를 순서대로 시도
  const toggleSave = async (courseId: number, nextSaved: boolean) => {
    // optimistic update
    setResults((prev) => prev.map((c) => (c.courseId === courseId ? { ...c, isSaved: nextSaved } : c)));

    const candidates: Array<() => Promise<any>> = nextSaved
      ? [
          () => api.post(`/api/edu/courses/${courseId}/save`),
          () => api.post(`/api/edu/courses/${courseId}/saved`),
          () => api.post(`/api/edu/courses/${courseId}/bookmark`),
          () => api.post(`/api/edu/courses/${courseId}/like`),
        ]
      : [
          () => api.delete(`/api/edu/courses/${courseId}/save`),
          () => api.delete(`/api/edu/courses/${courseId}/saved`),
          () => api.delete(`/api/edu/courses/${courseId}/bookmark`),
          () => api.delete(`/api/edu/courses/${courseId}/like`),
        ];

    try {
      let ok = false;
      let lastErr: any = null;
      for (const call of candidates) {
        try {
          await call();
          ok = true;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!ok) throw lastErr;
    } catch (e) {
      console.error("[search] toggle save failed:", e);
      // revert
      setResults((prev) => prev.map((c) => (c.courseId === courseId ? { ...c, isSaved: !nextSaved } : c)));
    }
  };

  // ✅ 입력 2자 이상일 때 자동완성 리스트
  // - 전용 API 없으니 검색 API를 가볍게 호출(size 작게)해서 title 기반 자동완성
  // - 인기 검색어/히스토리도 부분매칭으로 섞어서 보여줌
  const fetchAutoComplete = async (keyword: string) => {
    try {
      const res = await api.get<ApiResponse<unknown>>("/api/edu/search/courses", {
        params: { sort: "recent", page: 0, size: SIZE_AUTOCOMPLETE, keyword },
      });

      const raw = Array.isArray(res.data.data) ? res.data.data : [];
      const titles = raw.map((x: any) => String(x?.title ?? x?.courseTitle ?? "")).filter(Boolean);

      const fromPopular = popularSuggestions.filter((s) => s.toLowerCase().includes(keyword.toLowerCase()));
      const fromHistory = history.map((h) => h.keyword).filter((s) => s.toLowerCase().includes(keyword.toLowerCase()));

      setAutoList(uniq([...titles, ...fromPopular, ...fromHistory]).slice(0, 10));
    } catch (e) {
      console.error("[search] autocomplete error:", e);
      const fromPopular = popularSuggestions.filter((s) => s.toLowerCase().includes(keyword.toLowerCase()));
      const fromHistory = history.map((h) => h.keyword).filter((s) => s.toLowerCase().includes(keyword.toLowerCase()));
      setAutoList(uniq([...fromPopular, ...fromHistory]).slice(0, 10));
    }
  };

  // -------------------------
  // effects
  // -------------------------
  useEffect(() => {
    void fetchHistory();
    void fetchPopularSuggestions();
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setAutoList([]);
      return;
    }

    const t = window.setTimeout(() => {
      void fetchAutoComplete(q);
    }, 250);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, popularSuggestions, history]);

  useEffect(() => {
    if (!hasQuery) return;
    if (results.length === 0 && !loading && !err) return;
    void fetchCourses(0, query.trim(), sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // -------------------------
  // handlers
  // -------------------------
  const resetToIdle = () => {
    setQuery("");
    setAutoList([]);
    setResults([]);
    setPage(0);
    setErr("");
    setSearching(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const runSearch = async (keyword: string) => {
    const k = keyword.trim();
    if (!k) return;
    setQuery(k);
    await fetchCourses(0, k);
    await fetchHistory();
  };

  const onSubmit = async () => {
    await runSearch(query);
  };

  const onClickSuggestionChip = async (s: string) => {
    await runSearch(s);
  };

  const onClickAutoItem = async (s: string) => {
    await runSearch(s);
  };

  const onCancel = () => {
    nav(-1);
  };

  // 추천 검색어: 토픽 3 + 키워드 3 (랜덤)
  const recommended = useMemo(() => {
    const topicPool = [...TOPIC_CHIPS];
    const topics: string[] = [];
    while (topics.length < 3 && topicPool.length > 0) {
      const idx = Math.floor(Math.random() * topicPool.length);
      topics.push(topicPool.splice(idx, 1)[0]);
    }

    const kwPool = [...popularSuggestions];
    const kws: string[] = [];
    while (kws.length < 3 && kwPool.length > 0) {
      const idx = Math.floor(Math.random() * kwPool.length);
      kws.push(kwPool.splice(idx, 1)[0]);
    }

    const fallback = ["외교", "환율", "검찰", "시위", "협상", "정당"];
    const fill = uniq([...kws, ...history.map((h) => h.keyword), ...fallback]).slice(0, 3);

    return { topic: topics, keyword: fill };
  }, [popularSuggestions, history]);

  const showIdle = !hasQuery;
  const showAutoComplete = hasQuery && isTyping && results.length === 0;
  const showResults = hasQuery && (results.length > 0 || err || (!loading && !searching));

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 검색바 */}
        <div className={styles.searchTop}>
          <div className={styles.searchBar}>
            <img src="/icons/iconamoon_search-bold.svg" alt="" className={styles.searchIcon} />
            <input
              ref={inputRef}
              className={styles.input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="토픽이나 키워드를 입력하세요."
              onKeyDown={(e) => {
                if (e.key === "Enter") void onSubmit();
              }}
              autoComplete="off"
            />
            {hasQuery && (
              <button type="button" className={styles.clearBtn} onClick={resetToIdle} aria-label="clear">
                ×
              </button>
            )}
          </div>

          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            취소
          </button>
        </div>

        {/* 검색중 */}
        {searching && (
          <div className={styles.searchingOverlay} aria-label="searching">
            <div className={styles.spinner} />
            <p className={styles.searchingText}>검색중</p>
          </div>
        )}

        {/* 0자: 추천 검색어 + 이전 검색어 */}
        {showIdle && (
          <div className={styles.idleWrap}>
            <section className={styles.block}>
              <h3 className={styles.blockTitle}>추천 검색어</h3>

              <div className={styles.chipWrap}>
                {recommended.topic.map((t) => (
                  <button
                    key={`topic-${t}`}
                    type="button"
                    className={styles.chipGray}
                    onClick={() => void onClickSuggestionChip(t)}
                  >
                    {t}
                  </button>
                ))}
                {recommended.keyword.map((k) => (
                  <button
                    key={`kw-${k}`}
                    type="button"
                    className={styles.chipGray}
                    onClick={() => void onClickSuggestionChip(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.block}>
              <div className={styles.blockHeaderRow}>
                <h3 className={styles.blockTitle}>이전 검색어</h3>
              </div>

              {history.length === 0 ? (
                <p className={styles.muted}>이전 검색어가 없습니다.</p>
              ) : (
                <ul className={styles.historyList}>
                  {history.map((h) => (
                    <li key={h.keywordId} className={styles.historyItem}>
                      <button className={styles.historyKeyword} onClick={() => void onClickSuggestionChip(h.keyword)}>
                        {h.keyword}
                      </button>
                      <button
                        className={styles.historyDelete}
                        onClick={() => void deleteHistoryItem(h.keywordId)}
                        aria-label="삭제"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {/* 입력 중(2자 이상): 자동완성 리스트 */}
        {showAutoComplete && (
          <div className={styles.autoWrap}>
            {autoList.length === 0 ? (
              <p className={styles.muted}>추천 검색어가 없습니다.</p>
            ) : (
              <ul className={styles.autoList}>
                {autoList.map((s) => (
                  <li key={s} className={styles.autoItem}>
                    <button type="button" className={styles.autoBtn} onClick={() => void onClickAutoItem(s)}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 결과 화면 (EDU-SEARCH-02) */}
        {showResults && (
          <div className={styles.resultWrap}>
            <p className={styles.resultCount}>검색 결과 {results.length}개</p>

            <div className={styles.sortTabs} role="tablist" aria-label="sort">
              <button
                type="button"
                className={`${styles.sortTab} ${sort === "recent" ? styles.sortActive : ""}`}
                onClick={() => setSort("recent")}
              >
                최신순
              </button>
              <button
                type="button"
                className={`${styles.sortTab} ${sort === "popular" ? styles.sortActive : ""}`}
                onClick={() => setSort("popular")}
              >
                인기순
              </button>
            </div>

            {err ? (
              <p className={styles.error}>{err}</p>
            ) : results.length === 0 && !loading ? (
              <div className={styles.emptyWrap}>
                <p className={styles.emptyText}>검색결과가 없습니다</p>

                {/* ✅ 결과 없음일 때 추천 검색어 재노출 */}
                <div className={styles.emptyChips}>
                  {[...recommended.topic, ...recommended.keyword].slice(0, 6).map((s) => (
                    <button
                      key={`empty-${s}`}
                      type="button"
                      className={styles.chipGray}
                      onClick={() => void onClickSuggestionChip(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.resultList}>
                {results.map((c) => (
                  <div
                    key={c.courseId}
                    className={styles.resultRow}
                    onClick={() => goToDetail(String(c.courseId), { from: "learn-search" })}
                  >
                    <img
                      src={c.thumbnailUrl ?? FALLBACK_THUMB}
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src.endsWith(FALLBACK_THUMB)) return;
                        img.src = FALLBACK_THUMB;
                      }}
                      alt=""
                      className={styles.thumb}
                    />
                    <div className={styles.rowBody}>
                      <h4 className={styles.rowTitle}>{c.title}</h4>
                      <div className={styles.tagRow}>
                        <span className={styles.tagBlue}>{c.topic ?? "토픽"}</span>
                        <span className={styles.tagBlue}>
                          {c.tags?.[0]
                            ? `#${c.tags[0].replace(/^#/, "")}`
                            : c.headline
                            ? `#${c.headline.slice(0, 10)}`
                            : "#서브토픽"}
                        </span>
                      </div>
                    </div>

                    {/* ✅ 찜 버튼: row 클릭과 분리 */}
                    <button
                      type="button"
                      className={styles.starBtn}
                      aria-label="save"
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleSave(c.courseId, !Boolean(c.isSaved));
                      }}
                    >
                      {c.isSaved ? "★" : "☆"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 더보기 */}
            {results.length > 0 && results.length % SIZE_RESULT === 0 && (
              <button className={styles.moreBtn} onClick={() => void fetchCourses(page + 1, query.trim())}>
                더보기
              </button>
            )}
          </div>
        )}

        <div className={styles.bottomSpace} />
        <BottomNav />
      </div>
    </div>
  );
}

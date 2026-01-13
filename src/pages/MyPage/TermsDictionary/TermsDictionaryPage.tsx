// src/pages/MyPage/TermsDictionary/TermsDictionaryPage.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./TermsDictionaryPage.module.css";

type Sort = "alphabetical" | "recent";

type StoredTerm = {
  termId: string;
  term: string;
  definition: string;
  exampleSentence: string;
  additionalExplanation: string;
  createdAt: number;
  lastSeenAt: number;
};

const TERM_STORE_KEY = "NIEDU_TERM_DICTIONARY_V1";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readTermStore(): StoredTerm[] {
  return safeParse<StoredTerm[]>(localStorage.getItem(TERM_STORE_KEY), []);
}

// ✅ 한글 초성(가나다순 그룹용)
const CHO = [
  "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ",
] as const;

function getInitialGroup(term: string) {
  if (!term) return "#";
  const ch = term.trim()[0];
  const code = ch.charCodeAt(0);

  // 한글 음절 범위
  if (code >= 0xac00 && code <= 0xd7a3) {
    const idx = Math.floor((code - 0xac00) / 588);
    return CHO[idx] ?? "ㅎ";
  }

  // 영문
  if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase();

  // 숫자/기타
  if (/[0-9]/.test(ch)) return "0-9";
  return "#";
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function periodLabelByTime(ts: number) {
  if (!ts) return "이전";
  const now = Date.now();
  const today0 = startOfDay(now);
  const target0 = startOfDay(ts);

  const diffDays = Math.floor((today0 - target0) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays <= 7) return "최근 7일";
  return "이전";
}

export default function TermsDictionaryPage() {
  const nav = useNavigate();

  const [sort, setSort] = useState<Sort>("alphabetical");
  const [openSort, setOpenSort] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allTerms = useMemo(() => {
    // ✅ localStorage에 누적된 “API로 내려온 용어” 전부
    const list = readTermStore();

    // term이 비어있는 이상치 제거
    return list.filter((t) => t.termId && t.term);
  }, []);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return allTerms.find((t) => t.termId === selectedId) ?? null;
  }, [selectedId, allTerms]);

  const groups = useMemo(() => {
    if (allTerms.length === 0) return [];

    if (sort === "alphabetical") {
      // 가나다순: group(초성) → term 오름차순
      const map = new Map<string, StoredTerm[]>();
      for (const t of allTerms) {
        const key = getInitialGroup(t.term);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(t);
      }

      const keys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b, "ko"));
      return keys.map((k) => ({
        title: k,
        items: map
          .get(k)!
          .slice()
          .sort((a, b) => a.term.localeCompare(b.term, "ko")),
      }));
    }

    // recent: lastSeenAt 기준 최신 → period(오늘/어제/최근7일/이전)로 묶기
    const sorted = allTerms
      .slice()
      .sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));

    const map = new Map<string, StoredTerm[]>();
    for (const t of sorted) {
      const key = periodLabelByTime(t.lastSeenAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }

    const order = ["오늘", "어제", "최근 7일", "이전"];
    return order
      .filter((k) => map.has(k))
      .map((k) => ({ title: k, items: map.get(k)! }));
  }, [allTerms, sort]);

  const sortLabel = sort === "alphabetical" ? "가나다 순" : "최근 저장 순";

  const openDetail = (termId: string) => {
    setSelectedId(termId);
    setOpen(true);
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <header className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => nav(-1)} aria-label="뒤로가기">
            <img src="/icons/fluent_ios-arrow-24-filled.svg" alt="" />
          </button>
          <h1 className={styles.title}>용어사전</h1>

          {/* ✅ 드롭다운 정렬(스샷처럼 버튼 2개 아님) */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className={styles.sortDropBtn ?? styles.rightDummy}
              onClick={() => setOpenSort((v) => !v)}
              aria-label="정렬"
            >
              {sortLabel}
              <span style={{ marginLeft: 6 }}>▾</span>
            </button>

            {openSort && (
              <div className={styles.sortMenu ?? ""} style={{
                position: "absolute",
                top: 38,
                right: 0,
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                padding: 6,
                zIndex: 20,
                minWidth: 140
              }}>
                <button
                  type="button"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: sort === "alphabetical" ? "rgba(96,136,248,0.12)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Pretendard",
                  }}
                  onClick={() => {
                    setSort("alphabetical");
                    setOpenSort(false);
                  }}
                >
                  가나다 순
                </button>

                <button
                  type="button"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: sort === "recent" ? "rgba(96,136,248,0.12)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Pretendard",
                  }}
                  onClick={() => {
                    setSort("recent");
                    setOpenSort(false);
                  }}
                >
                  최근 저장 순
                </button>
              </div>
            )}
          </div>
        </header>

        {allTerms.length === 0 ? (
          <p className={styles.empty}>용어가 없어요. (학습에서 용어 카드를 열어보면 자동 저장돼요)</p>
        ) : (
          <div className={styles.groups}>
            {groups.map((g) => (
              <section key={g.title} className={styles.group}>
                <div className={styles.groupTitle}>{g.title}</div>

                <div className={styles.termGrid}>
                  {g.items.map((t) => (
                    <button
                      key={t.termId}
                      className={styles.termChip}
                      onClick={() => openDetail(t.termId)}
                    >
                      {t.term}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className={styles.bottomSpace} />
      </div>

      <BottomNav activeTab="mypage" />

      {/* ✅ 상세 팝업: 이제 API 호출 없이 localStorage 데이터로 바로 보여줌 */}
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.starBtn} type="button" aria-label="즐겨찾기">
              <img src="/icons/STAR.svg" alt="" />
            </button>

            {!selected ? (
              <p className={styles.empty}>상세를 불러오지 못했어요.</p>
            ) : (
              <>
                <h2 className={styles.termTitle}>{selected.term}</h2>
                <p className={styles.termDesc}>{selected.definition}</p>

                <div className={styles.block}>
                  <div className={styles.blockLabel}>예시 문장</div>
                  <div className={styles.blockText}>{selected.exampleSentence}</div>
                </div>

                <div className={styles.block}>
                  <div className={styles.blockLabel}>추가 설명</div>
                  <div className={styles.blockText}>{selected.additionalExplanation}</div>
                </div>
              </>
            )}
          </div>

          <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="닫기">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// src/pages/MyPage/TermsDictionary/TermsDictionaryPage.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./TermsDictionaryPage.module.css";

// ✅ N단계 팝업 CSS 재사용 (똑같이!)
import modal from "@/pages/article/session/N/StepN002.module.css";

type Sort = "alphabetical" | "recent";
type Tab = "all" | "favorite";

type StoredTerm = {
  termId: string;
  term: string;
  definition: string;
  exampleSentence: string;
  additionalExplanation: string;

  createdAt: number; // 전체 최신순 기준
  lastSeenAt: number; // 옵션
  isFavorite: boolean;
  favoritedAt: number; // 즐겨찾기 최신순 기준
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

function writeTermStore(list: StoredTerm[]) {
  localStorage.setItem(TERM_STORE_KEY, JSON.stringify(list));
}

function toggleFavoriteInStore(termId: string) {
  const now = Date.now();
  const prev = readTermStore();
  const next = prev.map((t) => {
    if (t.termId !== termId) return t;
    const nextFav = !t.isFavorite;
    return {
      ...t,
      isFavorite: nextFav,
      favoritedAt: nextFav ? now : 0,
    };
  });
  writeTermStore(next);
}

// ✅ 가나다 초성 그룹
function getInitialGroup(term: string) {
  if (!term) return "#";
  const s = term.trim();
  if (!s) return "#";
  const ch = s[0];
  const code = ch.charCodeAt(0);

  if (code >= 0xac00 && code <= 0xd7a3) {
    const idx = Math.floor((code - 0xac00) / 588);
    const CHO = [
      "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ",
    ];
    return CHO[idx] ?? "ㅎ";
  }

  if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase();
  if (/[0-9]/.test(ch)) return "0-9";
  return "#";
}

export default function TermsDictionaryPage() {
  const nav = useNavigate();

  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<Sort>("alphabetical");
  const [openSort, setOpenSort] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ✅ localStorage 기반
  const store = useMemo(() => {
    return readTermStore().filter((t) => t.termId && t.term);
  }, [tab, sort, open, selectedId]);

  const allCount = store.length;
  const favCount = store.filter((t) => t.isFavorite).length;

  const filtered = useMemo(() => {
    if (tab === "favorite") return store.filter((t) => t.isFavorite);
    return store;
  }, [store, tab]);

  // ✅ 정렬 + 그룹
  const groups = useMemo(() => {
    if (filtered.length === 0) return [];

    // 최신순: 한 그룹으로만
    if (sort === "recent") {
      const arr = filtered.slice().sort((a, b) => {
        const ta = tab === "favorite" ? (a.favoritedAt || 0) : (a.createdAt || 0);
        const tb = tab === "favorite" ? (b.favoritedAt || 0) : (b.createdAt || 0);
        return tb - ta;
      });
      return [{ title: "", items: arr }];
    }

    // 가나다순: 초성 그룹
    const map = new Map<string, StoredTerm[]>();
    for (const t of filtered) {
      const key = getInitialGroup(t.term);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }

    const keys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b, "ko"));
    return keys.map((k) => ({
      title: k,
      items: map.get(k)!.slice().sort((a, b) => a.term.localeCompare(b.term, "ko")),
    }));
  }, [filtered, sort, tab]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return store.find((t) => t.termId === selectedId) ?? null;
  }, [selectedId, store]);

  const sortLabel = sort === "alphabetical" ? "가나다 순" : "최신 순";

  const openDetail = (termId: string) => {
    setSelectedId(termId);
    setOpen(true);
  };

  const onToggleFavorite = (termId: string) => {
    toggleFavoriteInStore(termId);

    // 즐겨찾기 탭에서 해제하면 목록에서 빠질 수 있어 팝업 닫기 처리
    if (tab === "favorite") {
      const after = readTermStore();
      const stillFav = after.some((t) => t.termId === termId && t.isFavorite);
      if (!stillFav) {
        setOpen(false);
        return;
      }
    }

    // selected 갱신 트리거
    setSelectedId(termId);
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <header className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => nav(-1)} aria-label="뒤로가기">
            <img src="/icons/fluent_ios-arrow.svg" alt="" />
          </button>

          <h1 className={styles.title}>용어사전</h1>

          <div className={styles.sortWrap}>
            <button
              type="button"
              className={styles.sortDropBtn}
              onClick={() => setOpenSort((v) => !v)}
              aria-label="정렬"
            >
              {sortLabel}
              <span>▾</span>
            </button>

            {openSort && (
              <div className={styles.sortMenu} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={`${styles.sortItem} ${
                    sort === "alphabetical" ? styles.sortItemActive : ""
                  }`}
                  onClick={() => {
                    setSort("alphabetical");
                    setOpenSort(false);
                  }}
                >
                  가나다 순
                </button>

                <button
                  type="button"
                  className={`${styles.sortItem} ${
                    sort === "recent" ? styles.sortItemActive : ""
                  }`}
                  onClick={() => {
                    setSort("recent");
                    setOpenSort(false);
                  }}
                >
                  최신 순
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 탭 */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "all" ? styles.tabActive : ""}`}
            onClick={() => setTab("all")}
          >
            전체 {allCount}
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "favorite" ? styles.tabActive : ""}`}
            onClick={() => setTab("favorite")}
          >
            즐겨찾기 {favCount}
          </button>
        </div>

        {/* 리스트 */}
        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {tab === "favorite"
              ? "즐겨찾기한 용어가 없어요."
              : "용어가 없어요. 학습에서 용어 카드를 열면 자동으로 저장돼요."}
          </p>
        ) : (
          <div className={styles.groups}>
            {groups.map((g) => (
              <section key={g.title || "recent"}>
                {sort === "alphabetical" && g.title && (
                  <div className={styles.groupTitle}>{g.title}</div>
                )}

                <div className={styles.termGrid}>
                  {g.items.map((t) => (
                    <button
                      key={t.termId}
                      className={styles.termChip}
                      onClick={() => openDetail(t.termId)}
                      title={t.term}
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

      {/* ✅ 팝업: StepN002 팝업이랑 완전 동일 */}
      {open && selected && (
        <div className={modal.modalOverlay} onClick={() => setOpen(false)}>
          <div className={modal.modal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={modal.modalStarBtn}
              onClick={() => onToggleFavorite(selected.termId)}
              aria-label="즐겨찾기"
            >
              <img
                className={modal.modalStarIcon}
                src={
                  selected.isFavorite
                    ? "/icons/Frame 1686564291 (1).svg"
                    : "/icons/Frame 1686564291.svg"
                }
                alt=""
              />
            </button>

            <h2 className={modal.modalTitle}>{selected.term}</h2>
            <p className={modal.modalDefinition}>{selected.definition}</p>

            <div className={modal.modalBlock}>
              <div className={modal.modalBlockTitle}>예시 문장</div>
              <div className={modal.modalBlockBody}>{selected.exampleSentence}</div>
            </div>

            <div className={modal.modalBlock}>
              <div className={modal.modalBlockTitle}>추가 설명</div>
              <div className={modal.modalBlockBody}>{selected.additionalExplanation}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// src/pages/article/session/N/StepN002.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN002.module.css";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

type Term = {
  id: string; // termId
  term: string; // name
  definition: string;
  example: string; // exampleSentence
  extra: string; // additionalExplanation
};

type StepMeta = {
  stepId: number;
  stepOrder: number;
  isCompleted: boolean;
  contentType: string;
  content: any;
  userAnswer: any;
};

type RouteState = {
  articleId?: string;
  articleUrl?: string;
  startTime: number;
  courseId?: number | string;
  sessionId?: number | string;
  level?: "N" | "E" | "I";
  steps?: StepMeta[];
};

// ✅ 로컬 용어사전 저장소(프론트-only)
type StoredTerm = {
  termId: string;
  term: string;
  definition: string;
  exampleSentence: string;
  additionalExplanation: string;

  createdAt: number; // 처음 저장된 시각 (최신순 기준)
  lastSeenAt: number; // 최근 열어본 시각(옵션)
  isFavorite: boolean; // 즐겨찾기 여부
  favoritedAt: number; // 즐겨찾기 누른 시각(즐겨찾기 최신순)
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

// ✅ terms 배열을 누적 저장(merge)
// - 동일 termId 있으면 텍스트는 최신값으로 덮고
// - createdAt/isFavorite/favoritedAt/lastSeenAt은 유지
function upsertTermsToStore(terms: Term[]) {
  const now = Date.now();
  const prev = readTermStore();
  const map = new Map<string, StoredTerm>();

  for (const t of prev) map.set(t.termId, t);

  for (const t of terms) {
    const exist = map.get(t.id);

    if (!exist) {
      map.set(t.id, {
        termId: t.id,
        term: t.term,
        definition: t.definition,
        exampleSentence: t.example,
        additionalExplanation: t.extra,
        createdAt: now,
        lastSeenAt: 0,
        isFavorite: false,
        favoritedAt: 0,
      });
    } else {
      map.set(t.id, {
        ...exist,
        term: t.term,
        definition: t.definition,
        exampleSentence: t.example,
        additionalExplanation: t.extra,
      });
    }
  }

  writeTermStore(Array.from(map.values()));
}

// ✅ “최근 열어본” 갱신(옵션)
function touchTerm(termId: string) {
  const now = Date.now();
  const prev = readTermStore();
  const next = prev.map((t) =>
    t.termId === termId ? { ...t, lastSeenAt: now } : t
  );
  writeTermStore(next);
}

// ✅ 즐겨찾기 토글 + 저장
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

function getFavoriteIdsFromStore(): string[] {
  return readTermStore()
    .filter((t) => t.isFavorite)
    .map((t) => t.termId);
}

export default function StepN002() {
  const nav = useNavigate();
  const location = useLocation();

  const { articleId, articleUrl, startTime, courseId, sessionId, steps } =
    (location.state as RouteState) || {};

  const STEP_ORDER = 2;
  const CONTENT_TYPE = "TERM_LEARNING";

  const currentStep = useMemo(() => {
    return (steps ?? []).find(
      (s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE
    );
  }, [steps]);

  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<Term[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [opened, setOpened] = useState<string[]>([]);
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [submitErr, setSubmitErr] = useState("");

  // ✅ mount 시: 로컬 즐겨찾기 불러오기
  useEffect(() => {
    setFavorites(getFavoriteIdsFromStore());
  }, []);

  // ✅ step.content 파싱 + 용어 전체 localStorage 누적 저장
  useEffect(() => {
    setLoading(true);
    setSubmitErr("");

    try {
      const rawTerms =
        currentStep?.content?.contents?.[0]?.terms ??
        currentStep?.content?.terms ??
        null;

      if (!currentStep || !Array.isArray(rawTerms)) {
        console.warn("[StepN002] TERM_LEARNING terms not found", {
          currentStep,
          rawTerms,
        });
        setTerms([]);
        setLoading(false);
        return;
      }

      const mapped: Term[] = rawTerms
        .map((t: any) => ({
          id: String(t?.termId ?? t?.id ?? ""),
          term: String(t?.name ?? t?.term ?? ""),
          definition: String(t?.definition ?? ""),
          example: String(t?.exampleSentence ?? t?.example ?? ""),
          extra: String(t?.additionalExplanation ?? t?.extra ?? ""),
        }))
        .filter((x: Term) => x.id && x.term);

      setTerms(mapped);

      if (mapped.length > 0) {
        upsertTermsToStore(mapped);
        // ✅ upsert 이후 즐겨찾기 상태 다시 로드 (동기화)
        setFavorites(getFavoriteIdsFromStore());
      }
    } catch (err) {
      console.error("[StepN002] term parse failed:", err);
      setTerms([]);
    } finally {
      setLoading(false);
    }
  }, [currentStep]);

  const openTerm = (term: Term) => {
    setActiveTerm(term);
    setOpened((prev) => (prev.includes(term.id) ? prev : [...prev, term.id]));
    touchTerm(term.id);
  };

  const toggleFavorite = (id: string) => {
    // ✅ store에 저장
    toggleFavoriteInStore(id);
    // ✅ UI state 즉시 반영
    setFavorites(getFavoriteIdsFromStore());
  };

  const canGoNext = opened.length > 0 && !loading;

  // ✅ answer 저장(있으면 서버에도 저장)
  const submitAnswer = async () => {
    setSubmitErr("");

    const cid = Number(courseId ?? articleId);
    const sid = Number(sessionId);
    const stepId = Number(currentStep?.stepId);

    // 식별자 없으면 서버 제출 스킵(프론트는 동작)
    if (!cid || Number.isNaN(cid) || !sid || Number.isNaN(sid) || !stepId) {
      return true;
    }

    const userAnswer = {
      openedTermIds: opened,
      favoriteTermIds: favorites,
    };

    try {
      await api.post<ApiResponse<null>>(
        `/api/edu/courses/${cid}/sessions/${sid}/steps/${stepId}/answer`,
        {
          contentType: CONTENT_TYPE,
          userAnswer,
        }
      );
      return true;
    } catch (err) {
      console.error("[StepN002] answer submit failed:", err);
      setSubmitErr("답안 저장에 실패했어요. 네트워크/로그인 상태를 확인해주세요.");
      return false;
    }
  };

  const goPrev = () => {
    nav("/nie/session/N/step/001", {
      state: {
        articleId,
        articleUrl,
        startTime,
        courseId,
        sessionId,
        level: "N",
        steps,
      },
    });
  };

  const goNext = async () => {
    if (!canGoNext) return;
    const ok = await submitAnswer();
    if (!ok) return;

    nav("/nie/session/N/step/003", {
      state: {
        articleId,
        articleUrl,
        startTime,
        courseId,
        sessionId,
        level: "N",
        steps,
      },
    });
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "28%" }} />
        </div>

        <h2 className={styles.heading}>용어 학습하기</h2>
        <p className={styles.desc}>
          본격적으로 뉴스를 읽기 전에
          <br />
          용어 카드로 미리 학습해보세요.
        </p>

        {submitErr && <div className={styles.skel}>{submitErr}</div>}

        <section className={styles.cardSection} aria-busy={loading}>
          {loading ? (
            <div className={styles.skel}>불러오는 중…</div>
          ) : (
            <div className={styles.cardGrid}>
              {terms.map((t) => {
                const fav = favorites.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={styles.card}
                    onClick={() => openTerm(t)}
                  >
                    <div className={styles.cardTop}>
                      <button
                        type="button"
                        className={styles.starBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(t.id);
                        }}
                      >
                        <img
                          src={
                            fav
                              ? "/icons/Frame 1686564291 (1).svg"
                              : "/icons/Frame 1686564291.svg"
                          }
                          alt=""
                          className={styles.starIcon}
                        />
                      </button>
                    </div>
                    <div className={styles.cardBody}>
                      <span className={styles.term}>{t.term}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className={styles.bottomSpace} />
      </div>
{/* ✅ 용어 상세 팝업 (용어사전 팝업과 동일 동작) */}
{activeTerm && (
  <div className={styles.modalOverlay} onClick={() => setActiveTerm(null)}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={styles.modalStarBtn}
        onClick={() => toggleFavorite(activeTerm.id)}
        aria-label="즐겨찾기"
      >
        <img
          className={styles.modalStarIcon}
          src={
            favorites.includes(activeTerm.id)
              ? "/icons/Frame 1686564291 (1).svg"
              : "/icons/Frame 1686564291.svg"
          }
          alt=""
        />
      </button>

      <h2 className={styles.modalTitle}>{activeTerm.term}</h2>
      <p className={styles.modalDefinition}>{activeTerm.definition}</p>

      <div className={styles.modalBlock}>
        <div className={styles.modalBlockTitle}>예시 문장</div>
        <div className={styles.modalBlockBody}>{activeTerm.example}</div>
      </div>

      <div className={styles.modalBlock}>
        <div className={styles.modalBlockTitle}>추가 설명</div>
        <div className={styles.modalBlockBody}>{activeTerm.extra}</div>
      </div>

      <button
        type="button"
        className={styles.modalCloseBtn}
        onClick={() => setActiveTerm(null)}
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  </div>
)}

      <EduBottomBar
        onPrev={goPrev}
        onNext={goNext}
        onQuit={() => nav("/learn")}
        disablePrev={false}
        disableNext={!canGoNext}
      />
    </div>
  );
}

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

export default function StepN002() {
  const nav = useNavigate();
  const location = useLocation();

  // StepRunner / StepN001 → 넘어온 값
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

  // ------------------------------------------
  // ✅ 백에서 내려온 step.content로 TERM_LEARNING 데이터 파싱
  // ------------------------------------------
  useEffect(() => {
    setLoading(true);
    setSubmitErr("");

    try {
      // 1) 보통: content.contents[0].terms
      const rawTerms =
        currentStep?.content?.contents?.[0]?.terms ??
        // 2) 혹시: content.terms 로 오는 경우
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
    } catch (err) {
      console.error("[StepN002] term parse failed:", err);
      setTerms([]);
    } finally {
      setLoading(false);
    }
  }, [currentStep]);

  // ------------------------------------------
  // 상태 변경 핸들러
  // ------------------------------------------
  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openTerm = (term: Term) => {
    setActiveTerm(term);
    setOpened((prev) => (prev.includes(term.id) ? prev : [...prev, term.id]));
  };

  const canGoNext = opened.length > 0 && !loading;

  // ------------------------------------------
  // ✅ answer 저장
  // ------------------------------------------
  const submitAnswer = async () => {
    setSubmitErr("");

    const cid = Number(courseId ?? articleId);
    const sid = Number(sessionId);
    const stepId = Number(currentStep?.stepId);

    if (!cid || Number.isNaN(cid) || !sid || Number.isNaN(sid) || !stepId) {
      console.warn("[StepN002] missing courseId/sessionId/stepId -> skip submit");
      return true; // 없으면 그냥 이동은 되게
    }

    // ✅ 너가 기존에 보내던 포맷 유지
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

  // 이전 단계로
  const goPrev = () => {
    nav("/nie/session/N/step/001", {
      state: {
        articleId,
        articleUrl,
        startTime,
        courseId,
        sessionId,
        level: "N",
        steps, // ✅ 유지
      },
    });
  };

  // 다음 단계로
  const goNext = async () => {
    if (!canGoNext) return;

    const ok = await submitAnswer();
    if (!ok) return; // 저장 실패 시 막고 싶으면 유지, 싫으면 삭제

    nav("/nie/session/N/step/003", {
      state: {
        articleId,
        articleUrl,
        startTime,
        courseId,
        sessionId,
        level: "N",
        steps, // ✅ 유지
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

      <EduBottomBar
        onPrev={goPrev}
        onNext={goNext}
        onQuit={() => nav("/learn")}
        disablePrev={false}
        disableNext={!canGoNext}
      />

      {activeTerm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button
              type="button"
              className={styles.modalStarBtn}
              onClick={() => toggleFavorite(activeTerm.id)}
            >
              <img
                src={
                  favorites.includes(activeTerm.id)
                    ? "/icons/Frame 1686564291 (1).svg"
                    : "/icons/Frame 1686564291.svg"
                }
                alt=""
                className={styles.modalStarIcon}
              />
            </button>

            <h3 className={styles.modalTitle}>{activeTerm.term}</h3>
            <p className={styles.modalDefinition}>{activeTerm.definition}</p>

            <div className={styles.modalBlock}>
              <div className={styles.modalBlockTitle}>예시 문장</div>
              <p className={styles.modalBlockBody}>{activeTerm.example}</p>
            </div>

            <div className={styles.modalBlock}>
              <div className={styles.modalBlockTitle}>부가 설명</div>
              <p className={styles.modalBlockBody}>{activeTerm.extra}</p>
            </div>

            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setActiveTerm(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

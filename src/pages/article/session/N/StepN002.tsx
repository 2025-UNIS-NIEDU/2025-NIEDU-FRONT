// src/pages/article/session/N/StepN002.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { submitStepAnswer } from "@/lib/apiClient";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN002.module.css";

// 🔹 로컬 JSON 데이터
import economyPackage from "@/data/economy_2025-11-24_package.json";

type StepState = {
  articleId?: string;
  articleUrl?: string;
  startTime: number;
  courseId?: string;
  sessionId?: string | number;
  stepId?: number;
};

type Term = {
  id: string;        // termId → string
  term: string;      // name
  definition: string;
  example: string;   // exampleSentence
  extra: string;     // additionalExplanation
};

export default function StepN002() {
  const nav = useNavigate();
  const location = useLocation();

  // StepRunner / StepN001 → 넘어온 값
  const { articleId, articleUrl, startTime, courseId, sessionId, stepId } =
    (location.state as StepState) || {};

  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<Term[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [opened, setOpened] = useState<string[]>([]);
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);

  // ------------------------------------------
  // 🔸 로컬 JSON에서 TERM_LEARNING 용어 데이터 가져오기
  // ------------------------------------------
  useEffect(() => {
    let abort = false;

    (async () => {
      try {
        setLoading(true);

        const pkg: any = economyPackage;

        // courseId / articleId → 숫자로 (없으면 1번 코스)
        const numericCourseId = Number(courseId ?? articleId ?? 1);
        const numericSessionId = Number(sessionId ?? 1);

        const course =
          pkg.courses?.find((c: any) => c.courseId === numericCourseId) ??
          pkg.courses?.[0];

        if (!course) {
          console.warn("[StepN002] 코스 데이터 없음");
          if (!abort) {
            setTerms([]);
            setLoading(false);
          }
          return;
        }

        const session =
          course.sessions?.find(
            (s: any) => s.sessionId === numericSessionId
          ) ?? course.sessions?.[0];

        if (!session) {
          console.warn("[StepN002] 세션 데이터 없음");
          if (!abort) {
            setTerms([]);
            setLoading(false);
          }
          return;
        }

        // level === "N" 인 퀴즈 블럭
        const quizN =
          session.quizzes?.find((q: any) => q.level === "N") ??
          session.quizzes?.[0];

        if (!quizN) {
          console.warn("[StepN002] N 레벨 퀴즈 없음");
          if (!abort) {
            setTerms([]);
            setLoading(false);
          }
          return;
        }

        // stepOrder 2, contentType TERM_LEARNING
        const step2 =
          quizN.steps?.find(
            (s: any) =>
              s.stepOrder === 2 && s.contentType === "TERM_LEARNING"
          ) ?? quizN.steps?.find((s: any) => s.contentType === "TERM_LEARNING");

        if (!step2 || !Array.isArray(step2.contents) || !step2.contents[0]) {
          console.warn("[StepN002] TERM_LEARNING 스텝/contents 없음", step2);
          if (!abort) {
            setTerms([]);
            setLoading(false);
          }
          return;
        }

        const termBlocks = step2.contents[0].terms;
        if (!Array.isArray(termBlocks)) {
          console.warn("[StepN002] contents[0].terms 배열이 아님", step2.contents[0]);
          if (!abort) {
            setTerms([]);
            setLoading(false);
          }
          return;
        }

        const mapped: Term[] = termBlocks.map((t: any) => ({
          id: String(t.termId),
          term: t.name,
          definition: t.definition,
          example: t.exampleSentence,
          extra: t.additionalExplanation,
        }));

        if (!abort) {
          setTerms(mapped);
          setLoading(false);
        }
      } catch (err) {
        console.error("[StepN002] 용어 데이터 로드 실패:", err);
        if (!abort) {
          setTerms([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      abort = true;
    };
  }, [articleId, courseId, sessionId]);

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
    setOpened((prev) =>
      prev.includes(term.id) ? prev : [...prev, term.id]
    );
  };

  const closeModal = () => setActiveTerm(null);

  const canGoNext = opened.length > 0 && !loading;

// 이전 단계로
const goPrev = () => {
  nav("/nie/session/N/step/001", {
    state: { articleId, articleUrl, startTime, courseId, sessionId, level: "N" }, // ✅
  });
};

// 다음 단계로
const goNext = async () => {
  if (!canGoNext) return;

  if (!courseId || !sessionId || !stepId) {
    console.warn("필수 값 부족 → API는 건너뛰고 이동만 실행.");
    nav("/nie/session/N/step/003", {
      state: { articleId, articleUrl, startTime, courseId, sessionId, level: "N" }, // ✅
    });
    return;
  }

  try {
    const userAnswer = {
      openedTermIds: opened,
      favoriteTermIds: favorites,
    };

    await submitStepAnswer({
      courseId,
      sessionId: String(sessionId),
      stepId,
      contentType: "TERM_LEARNING",
      userAnswer,
    });

    nav("/nie/session/N/step/003", {
      state: { articleId, articleUrl, startTime, courseId, sessionId, level: "N" }, // ✅
    });
  } catch (err) {
    console.error("🔥 StepN002 답변 저장 실패:", err);
  }
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
            <p className={styles.modalDefinition}>
              {activeTerm.definition}
            </p>

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

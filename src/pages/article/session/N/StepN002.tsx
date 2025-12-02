import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { submitStepAnswer } from "@/lib/apiClient";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN002.module.css";

type StepState = {
  articleId?: string;
  articleUrl?: string;
  startTime: number;
  courseId?: string;
  sessionId?: string;
  stepId?: number;
};

type Term = {
  id: string;
  term: string;
  definition: string;
  example: string;
  extra: string;
};

type ApiResp = {
  terms: Term[];
};

export default function StepN002() {
  const nav = useNavigate();
  const location = useLocation();

  // StepRunner → 넘겨준 값
  const { articleId, articleUrl, startTime, courseId, sessionId, stepId } =
    (location.state as StepState) || {};

  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<Term[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [opened, setOpened] = useState<string[]>([]);
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);

  // ------------------------------------------
  // ⭐ 실제 API 연동 자리
  // ------------------------------------------
  useEffect(() => {
    let abort = false;

    (async () => {
      // TODO: /api/edu/... 실제 terms API 연결
      const data: ApiResp = {
        terms: [
          {
            id: "t1",
            term: "전략적\n동반자 관계",
            definition:
              "전략적 동반자 관계는 두 국가가 외교적 협력을 강화하고 상호 발전을 도모하기 위해 맺는 격상된 관계입니다.",
            example:
              "한국과 싱가포르가 정상회담을 통해 전략적 동반자 관계를 수립했습니다.",
            extra:
              "두 국가가 서로의 비전을 맞추는 ‘장기 파트너십’ 개념입니다.",
          },
          {
            id: "t2",
            term: "정상 회담",
            definition:
              "국가 최고 지도자가 만나 주요 이슈를 논의하는 회의입니다.",
            example:
              "양국 정상은 회담에서 경제·안보 협력 방안을 논의했습니다.",
            extra: "나라 간의 직접 소통 창구 역할을 합니다.",
          },
          {
            id: "t3",
            term: "공동언론발표",
            definition:
              "회담 합의 내용을 양국이 함께 발표하는 공식 문서입니다.",
            example:
              "정상들은 공동언론발표를 통해 협력 내용을 국민에게 알렸습니다.",
            extra: "같은 내용을 같은 목소리로 전달하는 상징성이 있습니다.",
          },
          {
            id: "t4",
            term: "외교 관계\n격상",
            definition:
              "기존보다 더 높은 수준의 협력 관계로 발전시키는 것을 의미합니다.",
            example: "양국은 외교 관계를 격상해 긴밀히 협력하기로 했습니다.",
            extra: "친구 사이에서 ‘절친’으로 진화하는 느낌입니다.",
          },
        ],
      };

      if (!abort) {
        setTerms(data.terms);
        setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, []);

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

  // ==========================================
  // ⭐ 이전 스텝 이동
  // ==========================================
  const goPrev = () => {
    nav("/nie/session/N/step/001", {
      state: { articleId, articleUrl, startTime, courseId, sessionId },
    });
  };

  // ==========================================
  // ⭐ 다음 스텝 + ANSWER API 호출
  // ==========================================
  const goNext = async () => {
    if (!canGoNext) return;

    if (!courseId || !sessionId || !stepId) {
      console.warn("필수 값 부족 → API는 건너뛰고 이동만 실행.");
      nav("/nie/session/N/step/003", {
        state: { articleId, articleUrl, startTime, courseId, sessionId },
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
        sessionId,
        stepId,
        contentType: "TERM_LEARNING",
        userAnswer,
      });

      nav("/nie/session/N/step/003", {
        state: { articleId, articleUrl, startTime, courseId, sessionId },
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
              onClick={closeModal}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// src/pages/article/ArticlePrepare.tsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./ArticlePrepare.module.css";

type Level = { code: "N" | "I" | "E"; name: string };

export type StepMeta = {
  stepId: number;
  stepOrder: number;
  isCompleted: boolean;
  contentType: string;
  content: any;
  userAnswer: any;
  isCorrect?: { contentId: number; isCorrect: boolean }[];
};

type PrepareLocationState = {
  articleTitle?: string;
  sessionId?: number;
};

export default function ArticlePrepare() {
  // URL에는 articleId만 있음
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { articleTitle, sessionId } =
    (location.state as PrepareLocationState) || {};

  const [title] = useState(
    articleTitle ?? "제목 없는 기사" // ✅ 넘어온 제목 or 기본값
  );

  const [levels] = useState<Level[]>([
    { code: "N", name: "N단계" },
    
    { code: "I", name: "I단계" },
    { code: "E", name: "E단계" },
  ]);
  const [level, setLevel] = useState<Level | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLevel(levels[0]); // 기본 선택 N단계
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 드롭다운 바깥 클릭 닫기
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // ✅ 세션 시작
  const startSession = async () => {
    if (!level || !articleId) {
      setErrorMsg("필수 정보가 부족해요.");
      return;
    }

    // 세션 id 없으면 일단 StepRunner로만 보내기 (API 없이)
    if (!sessionId) {
      navigate(`/nie/session/${level.code}/step/1`, {
        state: {
          articleId,
          sessionId: null,
          level: level.code,
          steps: [] as StepMeta[],
          progress: 0,
        },
        replace: true,
      });
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch(
        `/api/edu/courses/${articleId}/sessions/${sessionId}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            level: level.code,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json?.message || "세션 시작 중 오류가 발생했어요.");
      }

      const {
        entryStepId,
        steps,
        progress,
      }: { entryStepId: number; steps: StepMeta[]; progress: number } =
        json.data;

      navigate(`/nie/session/${level.code}/step/${entryStepId}`, {
        state: {
          articleId,
          sessionId,
          level: level.code,
          steps,
          progress,
        },
        replace: true,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "세션을 시작할 수 없어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 상단 */}
        <header className={styles.header}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
          >
            ←
          </button>
        </header>

        {/* 마스코트 + 제목 */}
        <section className={styles.hero}>
          <img className={styles.mascot} src="/icons/Frame 2 (1).svg" alt="" />
          <h1 className={styles.title}>
            {title.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
            세션을 선택하셨어요!
          </h1>
        </section>

        {/* 단계 선택 */}
        <section className={styles.levelSection} ref={menuRef}>
          <button
            className={styles.levelSelect}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            {level?.name ?? "단계 선택"}{" "}
            <span className={styles.caret}>▾</span>
          </button>

          {open && (
            <div className={styles.levelMenu} role="listbox">
              {levels.map((lv) => (
                <button
                  key={lv.code}
                  role="option"
                  aria-selected={level?.code === lv.code}
                  className={`${styles.levelItem} ${
                    level?.code === lv.code ? styles.levelActive : ""
                  }`}
                  onClick={() => {
                    setLevel(lv);
                    setOpen(false);
                  }}
                >
                  {lv.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {errorMsg && <p className={styles.error}>{errorMsg}</p>}

        {/* CTA */}
        <button
          className={styles.cta}
          onClick={startSession}
          disabled={!level || loading}
        >
          {loading ? "세션 준비 중..." : "학습 시작하기"}
        </button>

        <div className={styles.bottomSpace} />
      </div>

      <BottomNav activeTab="learn" />
    </div>
  );
}

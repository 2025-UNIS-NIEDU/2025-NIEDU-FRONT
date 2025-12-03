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
  articleUrl?: string;
};

export default function ArticlePrepare() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { articleTitle, sessionId, articleUrl } =
    (location.state as PrepareLocationState) || {};

  const [title] = useState(
    articleTitle ?? "제목 없는 기사"
  );

  const [levels] = useState<Level[]>([
    { code: "N", name: "N단계" },
    { code: "I", name: "I단계" },
    { code: "E", name: "E단계" },
  ]);
  const [level, setLevel] = useState<Level | null>(null);
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLevel(levels[0]); // 기본 N단계
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

  // ✅ 백엔드 없이 바로 StepRunner 로 보내기
  const startSession = () => {
    if (!level || !articleId) {
      setErrorMsg("필수 정보가 부족해요.");
      return;
    }

    const numericCourseId = Number(articleId);
    const courseId = Number.isNaN(numericCourseId) ? null : numericCourseId;

    navigate(`/nie/session/${level.code}/step/1`, {
      state: {
        articleId,
        articleUrl,
        startTime: Date.now(),
        courseId,
        sessionId: sessionId ?? null,
        level: level.code,
        steps: [] as StepMeta[], // 지금은 스텝 메타 없이 컴포넌트에서 JSON 직접 읽게
        progress: 0,
      },
      replace: true,
    });
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
          disabled={!level}
        >
          학습 시작하기
        </button>

        <div className={styles.bottomSpace} />
      </div>

      <BottomNav activeTab="learn" />
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./ArticlePrepare.module.css";

type Level = { code: "N" | "E" | "I"; name: string };

// 백엔드에서 내려주는 step 메타 타입 (필요한 최소만 정의)
export type StepMeta = {
  stepId: number;
  stepOrder: number;
  isCompleted: boolean;
  contentType: string;
  content: any;
  userAnswer: any;
  isCorrect?: { contentId: number; isCorrect: boolean }[];
};

export default function ArticlePrepare() {
  // ⚠️ articleId = courseId, sessionId는 라우트에 추가되어 있다고 가정
  const { articleId, sessionId } = useParams<{
    articleId: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();

  const [title] = useState(
    "“한-싱가포르 정상회담…\n'전략적 동반자 관계' 수립”"
  );
  const [levels] = useState<Level[]>([
    { code: "N", name: "N단계" },
    { code: "E", name: "E단계" },
    { code: "I", name: "I단계" },
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

  // ✅ startSession — 백엔드 세션 시작 API 호출
  const startSession = async () => {
    if (!level || !articleId || !sessionId) return;

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
          credentials: "include", // Cookie: accessToken 자동 포함
          body: JSON.stringify({
            level: level.code, // "N" | "E" | "I"
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

      // 👉 StepRunner 로 이동 (첫 스텝으로)
      // stepId는 백엔드의 entryStepId 를 그대로 사용
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

      {/* 하단 탭: 항상 '학습' 활성 */}
      <BottomNav activeTab="learn" />
    </div>
  );
}

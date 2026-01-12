// src/pages/article/ArticlePrepare.tsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./ArticlePrepare.module.css";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

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
// ✅ 백엔드 start 호출 후 StepRunner 로 보내기 + steps 저장(새로고침 대비)
const startSession = async () => {
  if (!level || !articleId || !sessionId) {
    setErrorMsg("필수 정보가 부족해요. (courseId/sessionId/level)");
    return;
  }

  const courseIdNum = Number(articleId);
  if (Number.isNaN(courseIdNum)) {
    setErrorMsg("courseId가 올바르지 않아요.");
    return;
  }

  setErrorMsg("");

  try {
    const res = await api.post<ApiResponse<any>>(
      `/api/edu/courses/${courseIdNum}/sessions/${sessionId}/start`,
      { level: level.code }
    );

    const payload = res.data?.data;

    // ✅ steps가 어디에 있든 최대한 찾아서 파싱
    const stepsRaw =
      (Array.isArray(payload?.steps) && payload.steps) ||
      (Array.isArray(payload?.session?.steps) && payload.session.steps) ||
      (Array.isArray(payload?.result?.steps) && payload.result.steps) ||
      [];

    const entryStepIdRaw =
      payload?.entryStepId ??
      payload?.session?.entryStepId ??
      payload?.result?.entryStepId ??
      1;

    const entryStepId = Number(entryStepIdRaw);

    // ✅ entryStepId로 entryOrder 찾기 (없으면 1)
    const entry = stepsRaw.find((s: any) => Number(s?.stepId) === entryStepId);
    const entryOrder = Number(entry?.stepOrder ?? 1);

    if (!stepsRaw.length) {
      // steps가 비어 있으면 StepRunner로 보내면 무조건 "세션 데이터 없음" 뜸
      console.warn("[ArticlePrepare] start ok but steps empty:", payload);
      setErrorMsg("세션 시작은 됐지만 steps 데이터가 없어요. (백엔드 응답 확인 필요)");
      return;
    }

    // ✅ 새로고침/직접진입 대비: sessionStorage에 저장
    const storageKey = `niedu_session_${courseIdNum}_${sessionId}_${level.code}`;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        articleId,
        articleUrl,
        startTime: Date.now(),
        courseId: courseIdNum,
        sessionId,
        level: level.code,
        steps: stepsRaw,
        progress: Number(payload?.progress ?? payload?.session?.progress ?? 0),
        entryStepId,
      })
    );

    navigate(`/nie/session/${level.code}/step/${entryOrder}`, {
      state: {
        articleId,
        articleUrl,
        startTime: Date.now(),
        courseId: courseIdNum,
        sessionId,
        level: level.code,
        steps: stepsRaw,
        progress: Number(payload?.progress ?? payload?.session?.progress ?? 0),
        entryStepId,
      },
      replace: true,
    });
  } catch (e) {
    console.error("[ArticlePrepare] start error:", e);
    setErrorMsg("세션 시작에 실패했어요. (로그인/토큰 확인)");
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

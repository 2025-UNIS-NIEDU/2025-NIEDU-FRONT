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

    const data = res.data.data;

    // ✅ start 응답에서 stepOrder 기반으로 첫 화면 결정
    // - 문서에는 entryStepId가 stepId (Long)로 옴
    // - StepRunner는 지금 stepIdParam을 "1/2/3"처럼 쓰니까
    //   우리 쪽에서 "entry stepOrder"를 찾아서 그 값으로 라우팅하는 게 안전함
    const steps = Array.isArray(data?.steps) ? data.steps : [];
    const entryStepId = Number(data?.entryStepId ?? 1);

    const entry = steps.find((s: any) => Number(s.stepId) === entryStepId);
    const entryOrder = Number(entry?.stepOrder ?? 1);

    navigate(`/nie/session/${level.code}/step/${entryOrder}`, {
      state: {
        articleId,
        articleUrl,
        startTime: Date.now(),
        courseId: courseIdNum,
        sessionId,
        level: level.code,
        steps,
        progress: Number(data?.progress ?? 0),
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

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
  sessionId?: number;   // 🔻 이제 "있으면 참고" 정도로만
  articleUrl?: string;
};

type CourseSession = {
  sessionId: number;
  title?: string;
  createdAt?: string;
};

const STORAGE_KEY = "NIEDU_STEP_RUNNER_STATE_V1";

export default function ArticlePrepare() {
  const { articleId } = useParams<{ articleId: string }>(); // 사실상 courseId
  const navigate = useNavigate();
  const location = useLocation();
  const { articleTitle, sessionId: sessionIdFromState, articleUrl } =
    (location.state as PrepareLocationState) || {};

  const courseIdNum = Number(articleId);

  const [title] = useState(articleTitle ?? "제목 없는 기사");

  const [levels] = useState<Level[]>([
    { code: "N", name: "N단계" },
    { code: "I", name: "I단계" },
    { code: "E", name: "E단계" },
  ]);

  const [level, setLevel] = useState<Level | null>(null);
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  // ✅ 세션 목록 + 선택된 세션
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    setLevel(levels[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (open && menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // ✅ courseId 기반으로 세션 목록을 먼저 불러오기
  useEffect(() => {
    if (!courseIdNum || Number.isNaN(courseIdNum)) {
      setErrorMsg("courseId가 올바르지 않아요.");
      return;
    }

    setLoadingSessions(true);
    setErrorMsg("");

    (async () => {
      try {
        const res = await api.get<ApiResponse<any[]>>(`/api/edu/courses/${courseIdNum}/sessions`);
        const raw = Array.isArray(res.data?.data) ? res.data.data : [];

        // sessionId 키가 뭔지 모르니 최대한 대응
        const mapped: CourseSession[] = raw
          .map((x: any) => {
            const sid = Number(x?.sessionId ?? x?.id ?? x?.sessionID ?? 0);
            if (!sid) return null;
            return {
              sessionId: sid,
              title: x?.title ? String(x.title) : undefined,
              createdAt: x?.createdAt ? String(x.createdAt) : undefined,
            };
          })
          .filter(Boolean) as CourseSession[];

        setSessions(mapped);

        // ✅ 우선순위: state로 넘어온 sessionId가 목록에 있으면 그걸로, 아니면 첫 번째
        const preferred =
          sessionIdFromState && mapped.some((s) => s.sessionId === sessionIdFromState)
            ? sessionIdFromState
            : mapped[0]?.sessionId ?? null;

        setSelectedSessionId(preferred);

        if (!preferred) {
          setErrorMsg("이 코스에는 세션 데이터가 없어요. (백엔드 데이터 확인)");
        }
      } catch (e) {
        console.error("[ArticlePrepare] sessions load error:", e);
        setSessions([]);
        setSelectedSessionId(null);
        setErrorMsg("세션 목록을 불러오지 못했어요. (로그인/토큰/서버 확인)");
      } finally {
        setLoadingSessions(false);
      }
    })();
  }, [courseIdNum, sessionIdFromState]);

  const startSession = async () => {
    if (!level || !courseIdNum || Number.isNaN(courseIdNum)) {
      setErrorMsg("필수 정보가 부족해요. (courseId/level)");
      return;
    }
    if (!selectedSessionId) {
      setErrorMsg("선택된 세션이 없어요. (세션 목록 확인)");
      return;
    }

    setErrorMsg("");

    try {
      const res = await api.post<ApiResponse<any>>(
        `/api/edu/courses/${courseIdNum}/sessions/${selectedSessionId}/start`,
        { level: level.code }
      );

      console.log("[ArticlePrepare] start raw response:", res.data);

      const data = res.data?.data;

      const steps =
        (Array.isArray(data?.steps) && data.steps) ||
        (Array.isArray(data?.stepMetas) && data.stepMetas) ||
        (Array.isArray(data?.stepList) && data.stepList) ||
        [];

      const entryStepId = Number(data?.entryStepId ?? data?.entryStep ?? 1);

      if (steps.length === 0) {
        setErrorMsg("세션은 시작됐지만 steps 데이터가 없어요. (이 세션은 학습 데이터가 없을 수 있어요)");
        return;
      }

      const entry = steps.find((s: any) => Number(s.stepId) === entryStepId);
      const entryOrder = Number(entry?.stepOrder ?? 1);

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          articleId,
          articleUrl,
          startTime: Date.now(),
          courseId: courseIdNum,
          sessionId: selectedSessionId,
          level: level.code,
          steps,
          progress: Number(data?.progress ?? 0),
          entryStepId,
        })
      );

      navigate(`/nie/session/${level.code}/step/${entryOrder}`, {
        state: {
          articleId,
          articleUrl,
          startTime: Date.now(),
          courseId: courseIdNum,
          sessionId: selectedSessionId,
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
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="뒤로가기">
            ←
          </button>
        </header>

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

        {/* ✅ 세션 선택 UI (간단 드롭다운/텍스트 형태) */}
        <div style={{ padding: "0 20px", marginTop: 8 }}>
          {loadingSessions ? (
            <div style={{ fontSize: 12, opacity: 0.7 }}>세션 불러오는 중...</div>
          ) : sessions.length > 0 ? (
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              선택된 세션: <b>{selectedSessionId}</b>
            </div>
          ) : null}
        </div>

        <section className={styles.levelSection} ref={menuRef}>
          <button
            className={styles.levelSelect}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            {level?.name ?? "단계 선택"} <span className={styles.caret}>▾</span>
          </button>

          {open && (
            <div className={styles.levelMenu} role="listbox">
              {levels.map((lv) => (
                <button
                  key={lv.code}
                  role="option"
                  aria-selected={level?.code === lv.code}
                  className={`${styles.levelItem} ${level?.code === lv.code ? styles.levelActive : ""}`}
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

        <button className={styles.cta} onClick={startSession} disabled={!level || !selectedSessionId}>
          학습 시작하기
        </button>

        <div className={styles.bottomSpace} />
      </div>

      <BottomNav activeTab="learn" />
    </div>
  );
}

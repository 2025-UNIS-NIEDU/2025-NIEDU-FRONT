// src/pages/article/session/I/StepI002.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepI002.module.css";
import { submitStepAnswer, quitSession } from "@/lib/apiClient";

type KeywordItem = { word: string; isTopicWord: boolean };
type Segment = { text: string; keyword?: string };

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
  startTime?: number;
  courseId?: number | string;
  sessionId?: number | string | null;
  level?: "N" | "E" | "I";
  steps?: StepMeta[];
};

export default function StepI002() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState) || {};

  const startTime = state.startTime ?? Date.now();
  const courseId = Number(state.courseId ?? state.articleId);
  const sessionId = Number(state.sessionId);
  const steps = state.steps ?? [];

  const STEP_ORDER = 2;
  const CONTENT_TYPE = "SUMMARY_READING";

  const currentStep = useMemo(() => {
    return steps.find(
      (s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE
    );
  }, [steps]);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [correctKeywords, setCorrectKeywords] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);

    try {
      const block = currentStep?.content?.contents?.[0] ?? currentStep?.content ?? null;
      if (!currentStep || !block) {
        setLoadError("요약문 데이터를 찾을 수 없어요.");
        setLoading(false);
        return;
      }

      const summaryText = typeof block?.summary === "string" ? block.summary : "";
      const kwArray: KeywordItem[] = Array.isArray(block?.keywords) ? block.keywords : [];

      if (!summaryText) {
        setLoadError("요약문 텍스트가 없어요.");
        setLoading(false);
        return;
      }

      const allWords = kwArray.map((k) => String(k.word));
      const topicWords = kwArray.filter((k) => !!k.isTopicWord).map((k) => String(k.word));

      setSummary(summaryText);
      setKeywords(allWords);
      setCorrectKeywords(topicWords);

      const prev = currentStep?.userAnswer?.keywords;
      if (Array.isArray(prev)) setSelected(prev.map(String));
      else setSelected([]);

      setRevealed(false);
    } catch (e) {
      console.error("[StepI002] parse failed:", e);
      setLoadError("요약문 데이터를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [currentStep]);

  const segments: Segment[] = useMemo(() => {
    if (!summary || keywords.length === 0) return [{ text: summary }];

    const text = summary;
    const segs: Segment[] = [];
    let index = 0;
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);

    while (index < text.length) {
      let foundKw: string | null = null;
      let foundPos = text.length;

      for (const kw of sortedKeywords) {
        const pos = text.indexOf(kw, index);
        if (pos !== -1 && pos < foundPos) {
          foundPos = pos;
          foundKw = kw;
        }
      }

      if (!foundKw) {
        segs.push({ text: text.slice(index) });
        break;
      }

      if (foundPos > index) segs.push({ text: text.slice(index, foundPos) });
      segs.push({ text: foundKw, keyword: foundKw });
      index = foundPos + foundKw.length;
    }

    return segs;
  }, [summary, keywords]);

  const toggleKeyword = (kw: string) => {
    if (revealed) return;
    setSelected((prev) => (prev.includes(kw) ? prev.filter((w) => w !== kw) : [...prev, kw]));
  };

  const submit = async () => {
    const stepId = Number(currentStep?.stepId);
    if (!courseId || !sessionId || !stepId) return;

    await submitStepAnswer({
      courseId,
      sessionId,
      stepId,
      contentType: CONTENT_TYPE,
      userAnswer: { keywords: selected },
    });
  };

  const handlePrev = () =>
    nav("/nie/session/I/step/001", { state: { ...state, startTime }, replace: true });

  const handleNext = async () => {
    if (!revealed) {
      setRevealed(true);
      return;
    }
    try {
      await submit();
    } catch (e) {
      console.error("[StepI002] submit error:", e);
    }
    nav("/nie/session/I/step/003", { state: { ...state, startTime }, replace: true });
  };

  const handleQuit = async () => {
    try {
      if (courseId && sessionId) await quitSession({ courseId, sessionId });
    } catch (e) {
      console.error("[StepI002] quit error:", e);
    }
    nav("/learn");
  };

  const disableNext = loading || !!loadError || (!revealed && selected.length === 0);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "15.38%" }} />
        </div>

        <h2 className={styles.heading}>요약문 읽기</h2>
        <p className={styles.desc}>핵심 키워드를 눌러 선택해보세요.</p>

        <section className={styles.summaryCard} aria-busy={loading}>
          {loading ? (
            <div className={styles.skel}>불러오는 중…</div>
          ) : loadError ? (
            <div className={styles.skel}>{loadError}</div>
          ) : (
            <p className={styles.summaryText}>
              {segments.map((seg, i) =>
                seg.keyword ? (
                  <span
                    key={i}
                    className={`${styles.keyword} ${
                      revealed
                        ? correctKeywords.includes(seg.keyword)
                          ? styles.keywordActive
                          : ""
                        : selected.includes(seg.keyword)
                        ? styles.keywordActive
                        : ""
                    }`}
                    onClick={() => toggleKeyword(seg.keyword!)}
                  >
                    {seg.text}
                  </span>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
            </p>
          )}
        </section>

        {revealed && !loadError && (
          <div className={styles.hintBubble}>정답 키워드: {correctKeywords.join(", ")}</div>
        )}

        <div className={styles.bottomSpace} />

        <EduBottomBar onPrev={handlePrev} onNext={handleNext} onQuit={handleQuit} disableNext={disableNext} />
      </div>
    </div>
  );
}

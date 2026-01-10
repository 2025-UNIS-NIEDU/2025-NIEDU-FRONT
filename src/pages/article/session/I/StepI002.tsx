// src/pages/article/session/I/StepI002.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import styles from "./StepI002.module.css";

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

type KeywordItem = { word: string; isTopicWord: boolean };
type SummaryReadingContent = { summary: string; keywords: KeywordItem[] };
type Segment = { text: string; keyword?: string };

export default function StepI002() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState | undefined) ?? {};

  const steps = state.steps ?? [];
  const STEP_ORDER = 2;
  const CONTENT_TYPE = "SUMMARY_READING";

  const currentStep = useMemo(() => {
    return (
      steps.find(
        (s) => Number(s.stepOrder) === STEP_ORDER && s.contentType === CONTENT_TYPE
      ) ?? steps.find((s) => Number(s.stepOrder) === STEP_ORDER)
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

    const content = (currentStep?.content ?? {}) as Partial<SummaryReadingContent>;

    if (content.summary && Array.isArray(content.keywords)) {
      const allWords = content.keywords.map((k) => k.word);
      const topicWords = content.keywords.filter((k) => k.isTopicWord).map((k) => k.word);

      setSummary(String(content.summary));
      setKeywords(allWords);
      setCorrectKeywords(topicWords);

      const prev = currentStep?.userAnswer?.keywords;
      if (Array.isArray(prev)) setSelected(prev.map(String));

      setLoading(false);
    } else {
      setLoadError("요약문 데이터를 불러오지 못했어요.");
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

  const handlePrev = () => nav("/nie/session/I/step/001", { state: { ...state }, replace: true });

  const handleNext = async () => {
    if (!revealed) {
      setRevealed(true);
      return;
    }

    const cid = Number(state.courseId ?? state.articleId);
    const sid = Number(state.sessionId);
    const stepId = Number(currentStep?.stepId);
    if (cid && sid && stepId) {
      try {
        await submitStepAnswer({
          courseId: cid,
          sessionId: sid,
          stepId,
          contentType: CONTENT_TYPE,
          userAnswer: { keywords: selected },
        });
      } catch (e) {
        console.error("[StepI002] submit answer error:", e);
      }
    }

    nav("/nie/session/I/step/003", { state: { ...state }, replace: true });
  };

  const disableNext = loading || !!loadError || (!revealed && selected.length === 0);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <h2 className={styles.heading}>요약문 읽기</h2>

        <section className={styles.summaryCard} aria-busy={loading}>
          {loading ? (
            <div className={styles.skel}>불러오는 중…</div>
          ) : loadError ? (
            <p className={styles.errorText}>{loadError}</p>
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
          <p className={styles.revealText}>정답 키워드: {correctKeywords.join(", ")}</p>
        )}

        <EduBottomBar onPrev={handlePrev} onNext={handleNext} disableNext={disableNext} />
      </div>
    </div>
  );
}

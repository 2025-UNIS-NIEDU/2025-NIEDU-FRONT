import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN001.module.css";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

type KeywordItem = {
  word: string;
  isTopicWord: boolean;
};

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
  sessionId?: number | string;
  level?: "N" | "E" | "I";
  steps?: StepMeta[];
};

export default function StepN001() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteState) || {};

  const articleId = state.articleId;
  const articleUrl = state.articleUrl;
  const startTime = state.startTime ?? Date.now(); // 없으면 fallback
  const courseId = state.courseId;
  const sessionId = state.sessionId;
  const steps = state.steps ?? [];

  const STEP_ORDER = 1;
  const CONTENT_TYPE = "SUMMARY_READING";

  const currentStep = useMemo(() => {
    // stepOrder=1 + contentType
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
  const [submitErr, setSubmitErr] = useState<string>("");

  // ✅ step.content에서 summary/keywords 파싱
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    setSubmitErr("");

    try {
      // 서버 구조 예상:
      // step.content.contents[0] = { summary: string, keywords: [{word,isTopicWord}, ...] }
      const block =
        currentStep?.content?.contents?.[0] ??
        // 혹시 contents 없이 바로 오는 경우 방어
        currentStep?.content ??
        null;

      if (!currentStep || !block) {
        setLoadError("요약문 데이터를 찾을 수 없어요.");
        setSummary("");
        setKeywords([]);
        setCorrectKeywords([]);
        setLoading(false);
        return;
      }

      const summaryText =
        typeof block?.summary === "string" ? block.summary : "";

      const kwArray: KeywordItem[] = Array.isArray(block?.keywords)
        ? (block.keywords as KeywordItem[])
        : [];

      if (!summaryText) {
        setLoadError("요약문 텍스트가 없어요.");
        setSummary("");
        setKeywords([]);
        setCorrectKeywords([]);
        setLoading(false);
        return;
      }

      const allWords = kwArray.map((k) => String(k.word));
      const topicWords = kwArray
        .filter((k) => !!k.isTopicWord)
        .map((k) => String(k.word));

      setSummary(summaryText);
      setKeywords(allWords);
      setCorrectKeywords(topicWords);

      // 초기화
      setSelected([]);
      setRevealed(false);
    } catch (e) {
      console.error("[StepN001] parse failed:", e);
      setLoadError("요약문 데이터를 불러오지 못했어요.");
      setSummary("");
      setKeywords([]);
      setCorrectKeywords([]);
    } finally {
      setLoading(false);
    }
  }, [currentStep]);

  // ✅ 요약문을 일반 텍스트 / 키워드 조각으로 나누기
  const segments: Segment[] = useMemo(() => {
    if (!summary || keywords.length === 0) return [{ text: summary }];

    const text = summary;
    const segs: Segment[] = [];
    let idx = 0;

    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);

    while (idx < text.length) {
      let foundKw: string | null = null;
      let foundPos = text.length;

      for (const kw of sortedKeywords) {
        const pos = text.indexOf(kw, idx);
        if (pos !== -1 && pos < foundPos) {
          foundPos = pos;
          foundKw = kw;
        }
      }

      if (!foundKw) {
        segs.push({ text: text.slice(idx) });
        break;
      }

      if (foundPos > idx) segs.push({ text: text.slice(idx, foundPos) });

      segs.push({ text: foundKw, keyword: foundKw });
      idx = foundPos + foundKw.length;
    }

    return segs;
  }, [summary, keywords]);

  const toggleKeyword = (kw: string) => {
    if (revealed) return;
    setSelected((prev) =>
      prev.includes(kw) ? prev.filter((w) => w !== kw) : [...prev, kw]
    );
  };

  // ✅ answer 저장 (정답 공개 시점에 1번만 저장)
  const submitAnswer = async () => {
    setSubmitErr("");

    const cid = Number(courseId ?? articleId);
    const sid = Number(sessionId);
    const stepId = Number(currentStep?.stepId);

    if (!cid || Number.isNaN(cid) || !sid || Number.isNaN(sid) || !stepId) {
      console.warn("[StepN001] missing courseId/sessionId/stepId -> skip submit");
      return true;
    }

    // 서버가 원하는 포맷 확정 전이라 "안전한 범용 형태"로 보냄
    // 필요하면 백에서 정해준 스키마로 바로 바꿔줄게.
    const userAnswer = {
      selectedKeywords: selected,
      revealed: true,
    };

    try {
      await api.post<ApiResponse<null>>(
        `/api/edu/courses/${cid}/sessions/${sid}/steps/${stepId}/answer`,
        {
          contentType: CONTENT_TYPE,
          userAnswer,
        }
      );
      return true;
    } catch (e) {
      console.error("[StepN001] submit failed:", e);
      setSubmitErr("답안 저장에 실패했어요. 네트워크/로그인 상태를 확인해주세요.");
      return false;
    }
  };

  const handleNext = async () => {
    if (loading || loadError) return;

    // 1) 아직 정답 공개 전이면: 공개 + 답 저장
    if (!revealed) {
      const ok = await submitAnswer();
      if (!ok) return; // 저장 실패 시 막고 싶으면 유지. 싫으면 지워도 됨.
      setRevealed(true);
      return;
    }

    // 2) 공개 후 다음으로 이동
    nav("/nie/session/N/step/002", {
      state: {
        articleId,
        articleUrl,
        startTime,
        courseId,
        sessionId,
        level: "N",
        steps, // ✅ 유지
      },
    });
  };

  const disableNextButton =
    loading || !!loadError || (!revealed && selected.length === 0);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "14%" }} />
        </div>

        <h2 className={styles.heading}>맥락 파악하기 (요약문 읽기)</h2>
        <p className={styles.desc}>
          기사에 대한 요약문을 먼저 읽고,
          <br />
          주제라고 생각되는 키워드를 클릭해보세요.
        </p>

        {submitErr && <div className={styles.skel}>{submitErr}</div>}

        <section className={styles.summaryCard} aria-busy={loading}>
          {loading ? (
            <div className={styles.skel}>불러오는 중…</div>
          ) : loadError ? (
            <p className={styles.errorText}>{loadError}</p>
          ) : (
            <p className={styles.summaryText}>
              {segments.map((seg, i) => {
                if (!seg.keyword) return <span key={i}>{seg.text}</span>;

                const isSelected = selected.includes(seg.keyword);
                const isCorrectKw = correctKeywords.includes(seg.keyword);
                const active = !revealed ? isSelected : isCorrectKw;

                return (
                  <span
                    key={i}
                    className={`${styles.keyword} ${
                      active ? styles.keywordActive : ""
                    }`}
                    onClick={() => toggleKeyword(seg.keyword!)}
                  >
                    {seg.text}
                  </span>
                );
              })}
            </p>
          )}
        </section>

        {revealed && !loadError && (
          <div className={styles.hintBubble}>
            기사의 주제어는 ‘{correctKeywords.join("’, ‘")}’ 예요.
            <br />
            내가 선택했던 키워드와 비교해보면 좋아요. 이제 다음 단계로 넘어가 볼까요?
          </div>
        )}

        <div className={styles.bottomSpace} />
      </div>

      <EduBottomBar
        onPrev={() => nav(-1)}
        onNext={handleNext}
        onQuit={() => nav("/learn")}
        disablePrev
        disableNext={disableNextButton}
      />
    </div>
  );
}

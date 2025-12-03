// src/pages/article/session/E/StepE002.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import type { StepMeta } from "@/pages/article/ArticlePrepare";
import styles from "./StepE002.module.css";

import economyPackage from "@/data/economy_2025-11-24_package.json";

type Props = {
  articleId?: string;
  articleUrl?: string;
  courseId?: string;
  sessionId?: string;
  stepMeta?: StepMeta;
};

type KeywordItem = {
  word: string;
  isTopicWord: boolean;
};

type SummaryReadingContent = {
  summary: string;
  keywords: KeywordItem[];
};

type Segment = { text: string; keyword?: string };

type LocationState = {
  articleId?: string;
  articleUrl?: string;
  courseId?: string;
  sessionId?: string;
};

// 🔍 코스/세션/레벨 "E"에서 SUMMARY_READING 하나 찾기
function findESummaryReading(
  pkg: any,
  courseId?: string | number,
  sessionId?: string | number
): SummaryReadingContent | undefined {
  const courses = pkg.courses ?? [];
  if (!courses.length) return undefined;

  const course =
    courses.find(
      (c: any) => String(c.courseId) === String(courseId ?? courses[0].courseId)
    ) ?? courses[0];

  const sessions = course?.sessions ?? [];
  if (!sessions.length) return undefined;

  const session =
    sessions.find(
      (s: any) =>
        String(s.sessionId) === String(sessionId ?? sessions[0].sessionId)
    ) ?? sessions[0];

  const quizE = session?.quizzes?.find((q: any) => q.level === "E");
  const step2 = quizE?.steps?.find(
    (s: any) => s.contentType === "SUMMARY_READING"
  );

  const content0 = step2?.contents?.[0];
  if (content0?.summary && Array.isArray(content0.keywords)) {
    return {
      summary: content0.summary as string,
      keywords: content0.keywords as KeywordItem[],
    };
  }

  return undefined;
}

export default function StepE002({
  articleId,
  articleUrl,
  courseId,
  sessionId,
  stepMeta,
}: Props) {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: LocationState };

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [correctKeywords, setCorrectKeywords] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);

  const effectiveArticleId = articleId ?? state?.articleId;
  const effectiveArticleUrl = articleUrl ?? state?.articleUrl;
  const effectiveCourseId = courseId ?? state?.courseId;
  const effectiveSessionId = sessionId ?? state?.sessionId;

  // ✅ stepMeta.content 우선, 없으면 JSON(E레벨 SUMMARY_READING) 사용
  useEffect(() => {
    setLoading(true);
    setLoadError(null);

    try {
      let content: SummaryReadingContent | undefined;

      const raw = stepMeta?.content as any;
      if (raw) {
        // 문자열이면 파싱, 아니면 그대로
        let obj = raw;
        if (typeof raw === "string") {
          try {
            obj = JSON.parse(raw);
          } catch (e) {
            console.warn("[StepE002] stepMeta.content JSON 파싱 실패", e, raw);
          }
        }

        // 두 가지 케이스 지원:
        // 1) 바로 { summary, keywords }
        // 2) { contents: [ { summary, keywords } ] }
        if (obj?.summary && Array.isArray(obj.keywords)) {
          content = obj as SummaryReadingContent;
        } else if (
          Array.isArray(obj?.contents) &&
          obj.contents[0]?.summary &&
          Array.isArray(obj.contents[0].keywords)
        ) {
          content = {
            summary: obj.contents[0].summary,
            keywords: obj.contents[0].keywords,
          } as SummaryReadingContent;
        }
      }

      // 백에서 안 내려오면 JSON에서 찾기
      if (!content) {
        content = findESummaryReading(
          economyPackage as any,
          effectiveCourseId,
          effectiveSessionId
        );
      }

      if (!content || !content.summary || !Array.isArray(content.keywords)) {
        console.warn("[StepE002] SUMMARY_READING 데이터 없음/포맷 불일치", {
          stepMeta,
          effectiveCourseId,
          effectiveSessionId,
        });
        setLoadError("요약문 데이터를 불러오지 못했어요.");
        setLoading(false);
        return;
      }

      const allWords = content.keywords.map((k) => k.word);
      const topicWords = content.keywords
        .filter((k) => k.isTopicWord)
        .map((k) => k.word);

      setSummary(content.summary);
      setKeywords(allWords);
      setCorrectKeywords(topicWords);
      setSelected([]);
      setRevealed(false);
      setLoading(false);
    } catch (e) {
      console.error("[StepE002] 데이터 로드 오류:", e);
      setLoadError("요약문 데이터를 불러오는 중 오류가 발생했어요.");
      setLoading(false);
    }
  }, [stepMeta, effectiveCourseId, effectiveSessionId]);

  // 요약문 → 일반 텍스트/키워드로 쪼개기 (StepI002와 동일 로직)
  const segments: Segment[] = useMemo(() => {
    if (!summary || keywords.length === 0) return [{ text: summary }];

    const text = summary;
    const segs: Segment[] = [];
    let index = 0;

    // 긴 키워드부터 매칭
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

      if (foundPos > index) {
        segs.push({ text: text.slice(index, foundPos) });
      }

      segs.push({ text: foundKw, keyword: foundKw });
      index = foundPos + foundKw.length;
    }

    return segs;
  }, [summary, keywords]);

  const toggleKeyword = (kw: string) => {
    if (revealed) return; // 정답 공개 후에는 고정
    setSelected((prev) =>
      prev.includes(kw) ? prev.filter((w) => w !== kw) : [...prev, kw]
    );
  };

  const handleNext = async () => {
    // 1단계: 정답 공개
    if (!revealed) {
      setRevealed(true);
      return;
    }

    // 2단계: (있으면) 답안 저장 후 E003으로 이동
    if (effectiveCourseId && effectiveSessionId && stepMeta) {
      try {
        const userAnswer = { keywords: selected };
        await submitStepAnswer({
          courseId: String(effectiveCourseId),
          sessionId: String(effectiveSessionId),
          stepId: stepMeta.stepId,
          contentType: stepMeta.contentType ?? "SUMMARY_READING",
          userAnswer,
        });
      } catch (e) {
        console.error("StepE002 답안 저장 오류:", e);
      }
    }

    nav("/nie/session/E/step/003", {
      state: {
        articleId: effectiveArticleId,
        articleUrl: effectiveArticleUrl,
        courseId: effectiveCourseId,
        sessionId: effectiveSessionId,
        level: "E",
      },
    });
  };

  const disableNext =
    loading || !!loadError || (!revealed && selected.length === 0);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 진행바 (퍼센트는 나중에 E단계 전체 스텝 수에 맞춰 조정) */}
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "60%" }} />
        </div>

        <h2 className={styles.heading}>핵심 키워드 다시 짚어보기</h2>
        <p className={styles.desc}>
          요약문을 읽고,
          <br />
          이 기사에서 특히 중요하다고 느끼는 키워드를 선택해보세요.
        </p>

        {/* 요약 카드 */}
        <section className={styles.summaryCard} aria-busy={loading}>
          {loading ? (
            <div className={styles.skel}>불러오는 중…</div>
          ) : loadError ? (
            <p className={styles.errorText}>{loadError}</p>
          ) : (
            <p className={styles.summaryText}>
              {segments.map((seg, i) => {
                if (!seg.keyword) {
                  return <span key={i}>{seg.text}</span>;
                }

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

        {/* 정답 공개 후 해설 말풍선 */}
        {revealed && !loadError && (
          <div className={styles.hintBubble}>
            이 기사에서 특히 중요한 키워드는 ‘
            {correctKeywords.join("’, ‘")}’ 입니다.
            <br />
            내가 선택했던 키워드와 비교하며, 왜 중요할지 한 번 생각해보세요.
          </div>
        )}

        <div className={styles.bottomSpace} />
      </div>

      <EduBottomBar
        onPrev={() => nav(-1)}
        onNext={handleNext}
        onQuit={() => nav("/learn")}
        disablePrev
        disableNext={disableNext}
      />
    </div>
  );
}

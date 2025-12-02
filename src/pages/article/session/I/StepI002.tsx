// src/pages/article/session/I/StepI002.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import type { StepMeta } from "@/pages/article/ArticlePrepare";
import styles from "./StepI002.module.css";

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
};

export default function StepI002({
  articleId,
  articleUrl,
  courseId,
  sessionId,
  stepMeta,
}: Props) {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: LocationState };

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [correctKeywords, setCorrectKeywords] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false); // 정답 공개 여부
  const [loadError, setLoadError] = useState<string | null>(null);

  const effectiveArticleId = articleId ?? state?.articleId;
  const effectiveArticleUrl = articleUrl ?? state?.articleUrl;

  // ✅ 백엔드에서 내려준 stepMeta.content를 파싱 (StepN001과 동일한 포맷)
  useEffect(() => {
    setLoading(true);
    setLoadError(null);

    const content = stepMeta?.content as SummaryReadingContent | undefined;

    if (content && content.summary && Array.isArray(content.keywords)) {
      const allWords = content.keywords.map((k) => k.word);
      const topicWords = content.keywords
        .filter((k) => k.isTopicWord)
        .map((k) => k.word);

      setSummary(content.summary);
      setKeywords(allWords);
      setCorrectKeywords(topicWords);
      setLoading(false);
    } else {
      console.warn("[StepI002] summary-reading content 없음 또는 포맷 불일치", {
        stepMeta,
      });
      setLoadError("요약문 데이터를 불러오지 못했어요.");
      setLoading(false);
    }
  }, [stepMeta]);

  // 요약문을 일반 텍스트 / 키워드 조각으로 나누기 (StepN001과 동일)
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

      if (foundPos > index) {
        segs.push({ text: text.slice(index, foundPos) });
      }

      segs.push({ text: foundKw, keyword: foundKw });

      index = foundPos + foundKw.length;
    }

    return segs;
  }, [summary, keywords]);

  // 모든 키워드(정답/오답 상관없이) 선택 가능
  const toggleKeyword = (kw: string) => {
    if (revealed) return; // 정답 공개 후에는 선택 막기

    setSelected((prev) =>
      prev.includes(kw) ? prev.filter((w) => w !== kw) : [...prev, kw]
    );
  };

  // 다음 버튼 로직
  const handleNext = async () => {
    if (!revealed) {
      // 1단계: 정답 공개 + 해설 말풍선 노출
      setRevealed(true);
      return;
    }

    // 2단계: 답안 저장 + 다음 스텝 이동 (StepN001과 비슷한 구조)
    if (courseId && sessionId && stepMeta) {
      try {
        const userAnswer = {
          keywords: selected,
        };

        await submitStepAnswer({
          courseId,
          sessionId,
          stepId: stepMeta.stepId,
          contentType: stepMeta.contentType ?? "SUMMARY_READING",
          userAnswer,
        });
      } catch (e) {
        console.error("StepI002 답안 저장 오류:", e);
      }
    }

    nav("/nie/session/I/step/003", {
      state: {
        articleId: effectiveArticleId,
        articleUrl: effectiveArticleUrl,
      },
    });
  };

  const disableNext =
    loading || !!loadError || (!revealed && selected.length === 0);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 진행바 (퍼센트는 나중에 전체 스텝 수에 맞춰 조정) */}
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "60%" }} />
        </div>

        <h2 className={styles.heading}>맥락 파악하기 (요약문 읽기)</h2>
        <p className={styles.desc}>
          기사에 대한 요약문을 먼저 읽고,
          <br />
          주제라고 생각되는 키워드를 클릭해보세요.
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
        disableNext={disableNext}
      />
    </div>
  );
}

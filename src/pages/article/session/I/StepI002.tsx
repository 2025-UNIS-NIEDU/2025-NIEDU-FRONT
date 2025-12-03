// src/pages/article/session/I/StepI002.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import type { StepMeta } from "@/pages/article/ArticlePrepare";
import styles from "./StepI002.module.css";

// 🔹 JSON 통으로 import (타입 any로 쓸 거라 에러 안 남)
import iPackage from "@/data/economy_2025-11-24_package.json";

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

// 🔍 JSON 어디에 있든 SUMMARY_READING 블록 찾기
function findSummaryReading(node: any): SummaryReadingContent | undefined {
  if (!node) return undefined;

  // 배열이면 각 요소 탐색
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findSummaryReading(item);
      if (found) return found;
    }
    return undefined;
  }

  // 객체면 자기 자신 먼저 검사
  if (typeof node === "object") {
    if (
      node.contentType === "SUMMARY_READING" &&
      Array.isArray(node.contents) &&
      node.contents.length > 0
    ) {
      const content0 = node.contents[0];
      if (content0.summary && content0.keywords) {
        return {
          summary: content0.summary as string,
          keywords: content0.keywords as KeywordItem[],
        };
      }
    }

    // 프로퍼티들 재귀 탐색
    for (const key of Object.keys(node)) {
      const value = (node as any)[key];
      const found = findSummaryReading(value);
      if (found) return found;
    }
  }

  return undefined;
}

// JSON 전체에서 한 번만 찾아서 캐싱
const SUMMARY_FROM_PACKAGE: SummaryReadingContent | undefined = findSummaryReading(
  iPackage as any
);

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
  const [revealed, setRevealed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const effectiveArticleId = articleId ?? state?.articleId;
  const effectiveArticleUrl = articleUrl ?? state?.articleUrl;

  // ✅ stepMeta.content 있으면 그것부터, 없으면 JSON에서 찾은 SUMMARY_READING 사용
  useEffect(() => {
    setLoading(true);
    setLoadError(null);

    const fromMeta = stepMeta?.content as SummaryReadingContent | undefined;
    const content = fromMeta ?? SUMMARY_FROM_PACKAGE;

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
      console.warn("[StepI002] SUMMARY_READING 데이터 없음/포맷 불일치", {
        stepMeta,
        SUMMARY_FROM_PACKAGE,
        rawPkg: iPackage,
      });
      setLoadError("요약문 데이터를 불러오지 못했어요.");
      setLoading(false);
    }
  }, [stepMeta]);

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

  const toggleKeyword = (kw: string) => {
    if (revealed) return;
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

    // 2단계: 답안 저장 + 003으로 이동
    if (courseId && sessionId && stepMeta) {
      try {
        const userAnswer = { keywords: selected };
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
        courseId,
        sessionId,
        level: "I"
      },
    });
  };

  const disableNext =
    loading || !!loadError || (!revealed && selected.length === 0);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 진행바 */}
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "60%" }} />
        </div>

        <h2 className={styles.heading}>맥락 파악하기 (요약문 읽기)</h2>
        <p className={styles.desc}>
          기사에 대한 요약문을 먼저 읽고,
          <br />
          주제라고 생각되는 키워드를 클릭해보세요.
        </p>

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

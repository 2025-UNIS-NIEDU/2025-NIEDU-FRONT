// src/pages/article/session/N/StepN001.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import type { StepMeta } from "@/pages/article/ArticlePrepare";
import styles from "./StepN001.module.css";

type KeywordItem = {
  word: string;
  isTopicWord: boolean;
};

type SummaryReadingContent = {
  summary: string;
  keywords: KeywordItem[];
};

type Props = {
  articleId?: string;
  articleUrl?: string;
  courseId?: string;
  sessionId?: string;
  stepMeta?: StepMeta;
};

type Segment = { text: string; keyword?: string };

export default function StepN001({
  articleId,
  articleUrl,
  courseId,
  sessionId,
  stepMeta,
}: Props) {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [correctKeywords, setCorrectKeywords] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false); // 정답 공개 여부
  const [loadError, setLoadError] = useState<string | null>(null);

  // ✅ 세션 시작 시간: StepN001이 처음 렌더될 때 한 번만 찍힘
  const [startTime] = useState(() => Date.now());

  // 🔹 백엔드 content → 화면용 데이터로 파싱
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
      console.warn("[StepN001] summary-reading content 없음 또는 포맷 불일치", {
        stepMeta,
      });
      setLoadError("요약문 데이터를 불러오지 못했어요.");
      setLoading(false);
    }
  }, [stepMeta]);

  // ✅ 요약문을 일반 텍스트 / 키워드 조각으로 나누기
  const segments: Segment[] = useMemo(() => {
    if (!summary || keywords.length === 0) return [{ text: summary }];

    const text = summary;
    const segs: Segment[] = [];
    let index = 0;

    // 길이가 긴 키워드부터 찾도록 정렬(겹침 방지용)
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);

    while (index < text.length) {
      let foundKw: string | null = null;
      let foundPos = text.length;

      // 현재 위치 이후에서 가장 먼저 나오는 키워드를 찾기
      for (const kw of sortedKeywords) {
        const pos = text.indexOf(kw, index);
        if (pos !== -1 && pos < foundPos) {
          foundPos = pos;
          foundKw = kw;
        }
      }

      // 더 이상 키워드가 없으면 나머지 전체를 일반 텍스트로
      if (!foundKw) {
        segs.push({ text: text.slice(index) });
        break;
      }

      // 키워드 앞의 일반 텍스트
      if (foundPos > index) {
        segs.push({ text: text.slice(index, foundPos) });
      }

      // 키워드 부분
      segs.push({ text: foundKw, keyword: foundKw });

      index = foundPos + foundKw.length;
    }

    return segs;
  }, [summary, keywords]);

  // ✅ 모든 키워드(정답/오답 상관없이) 선택 가능
  const toggleKeyword = (kw: string) => {
    // 정답 공개된 이후에는 더 이상 토글 안 되게
    if (revealed) return;

    setSelected((prev) =>
      prev.includes(kw) ? prev.filter((w) => w !== kw) : [...prev, kw]
    );
  };

  // ✅ 다음 버튼 로직
  // - 아직 정답 공개 안 됨: 정답만 하이라이트 + 해설 노출
  // - 이미 공개됨: 답안 저장 API 호출 후 다음 스텝으로 이동
  const handleNext = async () => {
    if (!revealed) {
      setRevealed(true);
      return;
    }

    // 🔹 정답 공개 이후: 서버에 사용자 응답 저장 시도
    if (courseId && sessionId && stepMeta) {
      try {
        // ✅ N001 스펙에 맞춘 userAnswer(JSON):
        // { "keywords": string[] }
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
        console.error("StepN001 답안 저장 오류:", e);
        // TODO: 토스트나 에러 메시지 추가 가능
      }
    }

    // 🔹 다음 스텝으로 이동 (002)
    nav("/nie/session/N/step/002", {
      state: {
        articleId,
        articleUrl,
        startTime, // 세션 경과 시간 재사용 가능
        courseId,
        sessionId,
      },
    });
  };

  const disableNextButton =
    loading ||
    !!loadError ||
    (!revealed && selected.length === 0); // 정답 보기 전에는 최소 1개 선택 필요

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 진행바 */}
        <div className={styles.progressWrap}>
          <div className={styles.progress} style={{ width: "14%" }} />
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

                // 🔵 정답 공개 전: 사용자가 선택한 키워드만 파란 pill
                // 🔵 정답 공개 후: 정답 키워드만 파란 pill
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
        disableNext={disableNextButton}
      />
    </div>
  );
}

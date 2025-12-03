// src/pages/article/session/N/StepN001.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepN001.module.css";

// 🔹 로컬 JSON 데이터
import economyPackage from "@/data/economy_2025-11-24_package.json";

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
};

type Segment = { text: string; keyword?: string };

// ArticlePrepare에서 넘어올 수도 있어서 한 번 받아 둠
type LocState = {
  articleId?: string;
  sessionId?: number | null;
};

export default function StepN001({
  articleId: propArticleId,
  articleUrl,
  courseId: propCourseId,
  sessionId: propSessionId,
}: Props) {
  const nav = useNavigate();
  const location = useLocation();
  const locState = (location.state as LocState) || {};

  // ▲ 우선순위: props → location.state → 없으면 1번 코스 / 1번 세션
  const articleId = propArticleId ?? String(locState.articleId ?? "1");
  const sessionId = Number(propSessionId ?? locState.sessionId ?? 1);
  const courseId = propCourseId ?? articleId;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [correctKeywords, setCorrectKeywords] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [startTime] = useState(() => Date.now());

  // 🔸 로컬 JSON에서 summary / keywords만 뽑기
  useEffect(() => {
    setLoading(true);
    setLoadError(null);

    try {
      const pkg: any = economyPackage;

      const cid = Number(articleId);
      const course =
        pkg.courses?.find((c: any) => c.courseId === cid) ?? pkg.courses?.[0];

      if (!course) {
        setLoadError("코스 데이터를 찾을 수 없어요.");
        setLoading(false);
        return;
      }

      const session =
        course.sessions?.find((s: any) => s.sessionId === sessionId) ??
        course.sessions?.[0];

      if (!session) {
        setLoadError("세션 데이터를 찾을 수 없어요.");
        setLoading(false);
        return;
      }

      // N단계 퀴즈 블럭 찾기
      const quizN =
        session.quizzes?.find((q: any) => q.level === "N") ??
        session.quizzes?.[0];

      if (!quizN) {
        setLoadError("N 단계 퀴즈 데이터를 찾을 수 없어요.");
        setLoading(false);
        return;
      }

      const step1 =
        quizN.steps?.find((s: any) => s.stepOrder === 1) ??
        quizN.steps?.[0];

      if (!step1) {
        setLoadError("요약문 단계 데이터를 찾을 수 없어요.");
        setLoading(false);
        return;
      }

      const block = step1.contents?.[0];

      // ✅ summary가 숫자로 와도 걸러내기
      let summaryText = "";
      if (block && typeof block.summary === "string") {
        summaryText = block.summary;
      } else if (typeof session.summary === "string") {
        // 혹시 contents.summary가 엉뚱하면 세션 요약으로 대체
        summaryText = session.summary;
      }

      const kwArray: KeywordItem[] = Array.isArray(block?.keywords)
        ? (block.keywords as KeywordItem[])
        : [];

      if (!summaryText) {
        setLoadError("요약문 텍스트가 없어요.");
        setLoading(false);
        return;
      }

      const allWords = kwArray.map((k) => k.word);
      const topicWords = kwArray
        .filter((k) => k.isTopicWord)
        .map((k) => k.word);

      setSummary(summaryText);
      setKeywords(allWords);
      setCorrectKeywords(topicWords);
      setLoading(false);
    } catch (e) {
      console.error("[StepN001] 로컬 JSON 파싱 실패", e);
      setLoadError("요약문 데이터를 불러오지 못했어요.");
      setLoading(false);
    }
  }, [articleId, sessionId]);

  // ✅ 요약문을 일반 텍스트 / 키워드 조각으로 나누기
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
    // 지금은 백에 답안 안 보내고, 그냥 플로우만 이어감
    if (!revealed) {
      setRevealed(true);
      return;
    }

    nav("/nie/session/N/step/002", {
      state: {
        articleId,
        articleUrl,
        startTime,
        courseId,
        sessionId,
        level: "N",  
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

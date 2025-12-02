// src/pages/article/session/E/StepE002.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import styles from "./StepE002.module.css";

type Props = { articleId?: string; articleUrl?: string };

type ApiResp = {
  summary: string;
  keywords: string[];        // 화면에 보이는 모든 키워드 (흰색 pill)
  correctKeywords: string[]; // 이 중 핵심 키워드
};

type Segment = { text: string; keyword?: string };

type LocationState = {
  articleId?: string;
  articleUrl?: string;
};

export default function StepE002({ articleId, articleUrl }: Props) {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: LocationState };

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [correctKeywords, setCorrectKeywords] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false); // 정답 공개 여부

  const effectiveArticleId = articleId ?? state?.articleId;
  const effectiveArticleUrl = articleUrl ?? state?.articleUrl;

  useEffect(() => {
    let abort = false;

    (async () => {
      // TODO: 나중에 실제 API 연동
      const data: ApiResp = {
        summary:
          "2023년 10월 2일, 한국의 이재명 대통령과 싱가포르의 로렌스 웡 총리가 용산 대통령실에서 정상회담을 열었다. 이 자리에서 두 정상은 양국이 전략적 동반자 관계를 수립했다고 발표했다. 올해가 수교 50주년인 만큼, 회담을 통해 그동안의 협력의 의미를 돌아보고 앞으로의 관계를 어떻게 이어갈지 논의했다.",
        keywords: ["전략적 동반자 관계", "수교 50주년", "협력", "미래"],
        correctKeywords: ["전략적 동반자 관계", "미래"],
      };

      if (!abort) {
        setSummary(data.summary);
        setKeywords(data.keywords);
        setCorrectKeywords(data.correctKeywords);
        setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, [effectiveArticleId]);

  // 요약문을 일반 텍스트 / 키워드 조각으로 나누기
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
    if (revealed) return; // 정답 공개 후에는 선택 막기(디자인에 따라 조절)

    setSelected((prev) =>
      prev.includes(kw) ? prev.filter((w) => w !== kw) : [...prev, kw]
    );
  };

  // 다음 버튼 로직
  const handleNext = () => {
    if (!revealed) {
      // 1단계: 정답 공개 + 해설 말풍선 노출
      setRevealed(true);
    } else {
      // 2단계: 다음 스텝으로 이동 (E003로 가정)
      nav("/nie/session/E/step/003", {
        state: {
          articleId: effectiveArticleId,
          articleUrl: effectiveArticleUrl,
        },
      });
    }
  };

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
        {revealed && (
          <div className={styles.hintBubble}>
            이 기사에서 특히 중요한 키워드는 ‘
            {correctKeywords.join("’, ‘")}’ 입니다.
            <br />
            내가 선택했던 키워드와 비교하며, 왜 중요할지 한번 생각해보세요.
          </div>
        )}

        <div className={styles.bottomSpace} />
      </div>

      <EduBottomBar
        onPrev={() => nav(-1)}
        onNext={handleNext}
        onQuit={() => nav("/learn")}
        disablePrev
        disableNext={loading || (!revealed && selected.length === 0)}
      />
    </div>
  );
}

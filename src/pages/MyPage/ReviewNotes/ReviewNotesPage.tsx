import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import styles from "./ReviewNotesPage.module.css";

type ReviewNoteItem = {
  quizType: string; // "OX_QUIZ" | "MULTIPLE_CHOICE" ...
  content: any;     // quizType 별 content
};

type ReviewNotesData = {
  topic?: string;
  level?: "N" | "I" | "E";
  title?: string; // 기사/세션 제목
  reviewNotes: ReviewNoteItem[];
};

function toKoreanLevel(code?: string) {
  if (code === "N") return "N단계";
  if (code === "I") return "I단계";
  if (code === "E") return "E단계";
  return "";
}

export default function ReviewNotesPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const initialDate = sp.get("date") ?? "";

  const [date, setDate] = useState(initialDate);
  const [data, setData] = useState<ReviewNotesData | null>(null);
  const [loading, setLoading] = useState(true);

  // 상단 7칸 네비(스샷처럼 1~7) — 간단히 "선택된 날짜 기준 최근 7일" 생성
  const dateList = useMemo(() => {
    if (!date) return [];
    const base = new Date(date);
    if (Number.isNaN(base.getTime())) return [];
    const arr: { label: number; iso: string }[] = [];
    // base 포함 과거 7일
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - (6 - i));
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      arr.push({ label: i + 1, iso: `${y}-${m}-${dd}` });
    }
    return arr;
  }, [date]);

  useEffect(() => {
    if (!date) return;

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiResponse<any>>(
          `/api/my/review-notes?date=${encodeURIComponent(date)}`
        );
        const d = res.data?.data ?? null;

        // 서버 스키마가 문서에서 상세히 안 내려와서, 최대한 유연하게 매핑
        setData({
          topic: d?.topic ?? d?.mainTopic ?? "",
          level: d?.level ?? d?.stage ?? "",
          title: d?.title ?? d?.articleTitle ?? "",
          reviewNotes: Array.isArray(d?.reviewNotes) ? d.reviewNotes : (Array.isArray(d?.quizzes) ? d.quizzes : []),
        });
      } catch (e) {
        console.error("[ReviewNotes] fetch error:", e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [date]);

  const currentIndex = useMemo(() => {
    if (!dateList.length) return 0;
    const idx = dateList.findIndex((x) => x.iso === date);
    return idx >= 0 ? idx : 0;
  }, [date, dateList]);

  const goPrev = () => {
    if (!dateList.length) return;
    const nextIdx = Math.max(0, currentIndex - 1);
    setDate(dateList[nextIdx].iso);
  };
  const goNext = () => {
    if (!dateList.length) return;
    const nextIdx = Math.min(dateList.length - 1, currentIndex + 1);
    setDate(dateList[nextIdx].iso);
  };

  const item = data?.reviewNotes?.[0]; // 스샷처럼 한 문제 카드만 보여주는 구조(일단 첫 문제만)

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <header className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => nav(-1)} aria-label="뒤로가기">
            <img src="/icons/fluent_ios-arrow-24-filled.svg" alt="" />
          </button>
          <h1 className={styles.title}>복습노트</h1>
          <div className={styles.rightDummy} />
        </header>

        <div className={styles.dateNav}>
          <button className={styles.navArrow} onClick={goPrev} aria-label="이전">
            ◀
          </button>

          <div className={styles.dots}>
            {dateList.map((d, idx) => (
              <button
                key={d.iso}
                className={`${styles.dot} ${d.iso === date ? styles.activeDot : ""}`}
                onClick={() => setDate(d.iso)}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button className={styles.navArrow} onClick={goNext} aria-label="다음">
            ▶
          </button>
        </div>

        <div className={styles.metaRow}>
          {data?.topic ? <span className={styles.chip}>{data.topic}</span> : <span />}
          {data?.level ? <span className={styles.levelChip}>{toKoreanLevel(data.level)}</span> : <span />}
        </div>

        <div className={styles.articleTitle}>
          {data?.title ? `“${data.title}”` : ""}
        </div>

        <div className={styles.card}>
          {loading ? (
            <p className={styles.loading}>불러오는 중...</p>
          ) : !item ? (
            <p className={styles.empty}>해당 날짜의 복습노트가 없어요.</p>
          ) : (
            <QuizRenderer item={item} />
          )}
        </div>

        <div className={styles.bottomSpace} />
      </div>

      <BottomNav activeTab="mypage" />
    </div>
  );
}

function QuizRenderer({ item }: { item: ReviewNoteItem }) {
  // OX 퀴즈 (스샷)
  if (item.quizType === "OX_QUIZ") {
    const q = item.content?.question ?? "";
    const correct = String(item.content?.correctAnswer ?? item.content?.answer ?? "O"); // "O" or "X"
    return (
      <div className={styles.quizWrap}>
        <div className={styles.question}>{q}</div>
        <div className={styles.oxRow}>
          <button className={styles.oxBtn}>O</button>
          <button className={styles.oxBtn}>X</button>
        </div>
        <div className={styles.answerHint}>
          정답: {correct}
        </div>
      </div>
    );
  }

  // 객관식 (스샷)
  if (item.quizType === "MULTIPLE_CHOICE") {
    const q = item.content?.question ?? "";
    const options = Array.isArray(item.content?.options) ? item.content.options : [];
    return (
      <div className={styles.quizWrap}>
        <div className={styles.question}>{q}</div>
        <div className={styles.mcList}>
          {options.map((op: any, idx: number) => (
            <button key={idx} className={styles.mcBtn}>
              {op?.label ? `${op.label}. ${op.text}` : String(op)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // fallback
  return (
    <div className={styles.quizWrap}>
      <div className={styles.question}>지원되지 않는 퀴즈 타입: {item.quizType}</div>
    </div>
  );
}

// src/pages/MyPage/ReviewNotes/ReviewNotesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import styles from "./ReviewNotesPage.module.css";

type ReviewNoteItem = {
  quizType: string;
  content: any;
  isCorrect?: boolean;
};

type ReviewNotesData = {
  topic?: string;
  subTopic?: string;
  level?: "N" | "I" | "E";
  title?: string;
  reviewNotes: ReviewNoteItem[];
};

function toKoreanLevel(code?: string) {
  if (code === "N") return "N단계";
  if (code === "I") return "I단계";
  if (code === "E") return "E단계";
  return "";
}

function normalizeQuizType(t: any) {
  return String(t ?? "").toUpperCase();
}

function parseIsCorrect(x: any): boolean | undefined {
  const v =
    x?.isCorrect ??
    x?.correct ??
    x?.isAnswerCorrect ??
    x?.result ??
    x?.isRight;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const u = v.toLowerCase();
    if (u === "true") return true;
    if (u === "false") return false;
  }
  return undefined;
}

function isMCType(t: string) {
  const u = String(t || "").toUpperCase();
  return (
    u === "MULTIPLE_CHOICE" ||
    u === "MULTIPLE_CHOICE_QUIZ" ||
    u === "MCQ" ||
    u.includes("MULTIPLE") ||
    u.includes("CHOICE")
  );
}

export default function ReviewNotesPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const date = sp.get("date") ?? "";
  const sessionId = sp.get("sessionId") ?? "";

  const [data, setData] = useState<ReviewNotesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  const [picked, setPicked] = useState<Record<number, string | null>>({});

  useEffect(() => {
    if (!date) return;

    const run = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("date", date);
        if (sessionId) qs.set("sessionId", sessionId);

        const res = await api.get<ApiResponse<any>>(`/api/my/review-notes?${qs.toString()}`);
        const d = res.data?.data ?? null;

        const notesRaw =
          Array.isArray(d?.reviewNotes) ? d.reviewNotes :
          Array.isArray(d?.quizzes) ? d.quizzes :
          Array.isArray(d?.wrongNotes) ? d.wrongNotes : [];

        const notes: ReviewNoteItem[] = Array.isArray(notesRaw)
          ? notesRaw
              .map((x: any) => ({
                quizType: normalizeQuizType(x?.quizType ?? x?.type ?? x?.questionType),
                content: x?.content ?? x?.payload ?? x,
                isCorrect: parseIsCorrect(x),
              }))
              .filter((x) => x.quizType)
          : [];

        // ✅ isCorrect가 하나라도 있으면 “틀린 것만”
        const hasBool = notes.some((n) => typeof n.isCorrect === "boolean");
        const wrongOnly = hasBool ? notes.filter((n) => n.isCorrect === false) : notes;

        setData({
          topic: d?.topic ?? d?.mainTopic ?? "",
          subTopic: d?.subTopic ?? "",
          level: d?.level ?? d?.stage ?? "",
          title: d?.title ?? d?.articleTitle ?? "",
          reviewNotes: wrongOnly,
        });

        setActiveIdx(0);
        setPicked({});
      } catch (e) {
        console.error("[ReviewNotes] fetch error:", e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [date, sessionId]);

  const total = data?.reviewNotes?.length ?? 0;
  const pages = useMemo(() => Array.from({ length: Math.max(1, total) }, (_, i) => i + 1), [total]);
  const item = total > 0 ? data?.reviewNotes?.[activeIdx] : null;

  const goPrev = () => setActiveIdx((p) => Math.max(0, p - 1));
  const goNext = () => setActiveIdx((p) => Math.min(total - 1, p + 1));

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <header className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => nav(-1)} aria-label="뒤로가기">
            <img src="/icons/fluent_ios-arrow-24-filled.svg" alt="" />
          </button>
          <h1 className={styles.title}>복습 노트</h1>
          <div className={styles.rightDummy} />
        </header>

        <div className={styles.pageNav}>
          <button className={styles.navArrow} onClick={goPrev} aria-label="이전" disabled={activeIdx <= 0}>
            ◀
          </button>

          <div className={styles.pageNums}>
            {pages.map((n, idx) => (
              <button
                key={n}
                className={`${styles.pageNum} ${idx === activeIdx ? styles.pageNumActive : ""}`}
                onClick={() => setActiveIdx(idx)}
              >
                {n}
              </button>
            ))}
          </div>

          <button className={styles.navArrow} onClick={goNext} aria-label="다음" disabled={activeIdx >= total - 1}>
            ▶
          </button>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.leftMeta}>
            {data?.topic ? <span className={styles.chip}>{data.topic}</span> : null}
            {data?.subTopic ? <span className={styles.chipHash}>#{data.subTopic}</span> : null}
          </div>
          {data?.level ? <span className={styles.levelChip}>{toKoreanLevel(data.level)}</span> : null}
        </div>

        {data?.title ? <div className={styles.articleTitle}>“{data.title}”</div> : null}

        <div className={styles.card}>
          {loading ? (
            <p className={styles.loading}>불러오는 중...</p>
          ) : !item ? (
            <p className={styles.empty}>틀린 문제가 없어요.</p>
          ) : (
            <QuizCard
              item={item}
              picked={picked[activeIdx] ?? null}
              onPick={(v) => setPicked((p) => ({ ...p, [activeIdx]: v }))}
            />
          )}
        </div>

        <div className={styles.dots} aria-label="틀린 문제 개수">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === activeIdx ? styles.dotActive : ""}`} />
          ))}
        </div>

        <div className={styles.bottomSpace} />
      </div>

      <BottomNav activeTab="mypage" />
    </div>
  );
}

function QuizCard({
  item,
  picked,
  onPick,
}: {
  item: ReviewNoteItem;
  picked: string | null;
  onPick: (v: string) => void;
}) {
  // OX
  if (item.quizType === "OX_QUIZ") {
    const q = String(item.content?.question ?? item.content?.q ?? "");
    const correct = String(item.content?.correctAnswer ?? item.content?.answer ?? "O");
    const explain =
      String(
        item.content?.answerExplanation ??
          item.content?.correctSentence ??
          item.content?.correctExplanation ??
          item.content?.explanation ??
          ""
      ).trim();

    return (
      <div className={styles.quizWrap}>
        <div className={styles.question}>{q}</div>

        <div className={styles.oxRow}>
          <button
            type="button"
            className={`${styles.oxBtn} ${picked === "O" ? styles.oxActive : ""}`}
            onClick={() => onPick("O")}
          >
            O
          </button>
          <button
            type="button"
            className={`${styles.oxBtn} ${picked === "X" ? styles.oxActive : ""}`}
            onClick={() => onPick("X")}
          >
            X
          </button>
        </div>

        {picked && <div className={styles.answerLine}>{explain ? explain : `정답: ${correct}`}</div>}
      </div>
    );
  }

  // Multiple Choice
  if (isMCType(item.quizType)) {
    const q = String(item.content?.question ?? "");
    const correct = String(item.content?.correctAnswer ?? item.content?.answer ?? "");
    const explain = String(item.content?.answerExplanation ?? item.content?.explanation ?? "").trim();

    const rawOptions = item.content?.options ?? item.content?.choices ?? [];
    const options: { label: string; text: string }[] = Array.isArray(rawOptions)
      ? rawOptions.map((o: any, idx: number) => ({
          label: String(o?.label ?? String.fromCharCode(65 + idx)),
          text: String(o?.text ?? o?.value ?? o ?? ""),
        }))
      : [];

    return (
      <div className={styles.quizWrap}>
        <div className={styles.question}>{q}</div>

        <div className={styles.mcList}>
          {options.map((o) => {
            const isSel = picked === o.label;
            const show = !!picked;
            const isCorrect = show && o.label === correct;
            const isWrong = show && isSel && o.label !== correct;

            return (
              <button
                key={o.label}
                type="button"
                className={`${styles.mcOption} ${isSel ? styles.mcPicked : ""} ${
                  isCorrect ? styles.mcCorrect : ""
                } ${isWrong ? styles.mcWrong : ""}`}
                onClick={() => onPick(o.label)}
              >
                <span className={styles.mcLabel}>{o.label}</span>
                <span className={styles.mcText}>{o.text}</span>
              </button>
            );
          })}
        </div>

        {picked && <div className={styles.answerLine}>{explain ? explain : `정답: ${correct}`}</div>}
      </div>
    );
  }

  return <div className={styles.empty}>지원하지 않는 문제 형식이에요.</div>;
}

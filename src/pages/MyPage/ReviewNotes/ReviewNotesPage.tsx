import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./ReviewNotesPage.module.css";

type NormalizedQuiz =
  | {
      kind: "OX";
      question: string;
      correct: "O" | "X";
      user?: "O" | "X";
      explanation?: string;
    }
  | {
      kind: "MCQ";
      question: string;
      options: { label: string; text: string }[];
      correct: string; // "A" | "B" ...
      user?: string; // "A" | "B" ...
      explanation?: string;
    };

function pickFirstString(...vals: any[]) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

function normalizeChoiceLabel(v: any): string | undefined {
  if (typeof v === "string") {
    const t = v.trim().toUpperCase();
    if (["A", "B", "C", "D", "E"].includes(t)) return t;
    // 숫자문자 "1" "2" 형태면 A/B로 변환
    if (/^\d+$/.test(t)) {
      const idx = Number(t);
      if (idx >= 1 && idx <= 5) return String.fromCharCode(64 + idx); // 1->A
    }
    return t;
  }
  if (typeof v === "number") {
    if (v >= 0 && v <= 4) return String.fromCharCode(65 + v); // 0->A
    if (v >= 1 && v <= 5) return String.fromCharCode(64 + v); // 1->A
  }
  return undefined;
}

function normalizeOx(v: any): "O" | "X" | undefined {
  if (typeof v === "string") {
    const t = v.trim().toUpperCase();
    if (t === "O" || t === "X") return t as "O" | "X";
    if (t === "TRUE") return "O";
    if (t === "FALSE") return "X";
  }
  if (typeof v === "boolean") return v ? "O" : "X";
  return undefined;
}

function computeIsCorrect(q: NormalizedQuiz): boolean | undefined {
  if (q.kind === "OX") {
    if (!q.user) return undefined;
    return q.user === q.correct;
  }
  if (q.kind === "MCQ") {
    if (!q.user) return undefined;
    return q.user === q.correct;
  }
  return undefined;
}

function normalizeItem(raw: any): NormalizedQuiz | null {
  const quizType = String(raw?.quizType ?? raw?.type ?? raw?.contentType ?? "").toUpperCase();
  const content = raw?.content ?? raw?.payload ?? raw;

  // 공통 필드 후보들
  const question = pickFirstString(content?.question, content?.q, raw?.question);

  // OX
  if (quizType.includes("OX")) {
    const correct = normalizeOx(content?.correctAnswer ?? content?.answer ?? raw?.correctAnswer);
    if (!question || !correct) return null;

    // user answer 후보들(서버 구현차이 대응)
    const user =
      normalizeOx(content?.userAnswer?.value) ??
      normalizeOx(content?.userAnswer) ??
      normalizeOx(raw?.userAnswer?.value) ??
      normalizeOx(raw?.userAnswer);

    const explanation = pickFirstString(
      content?.answerExplanation,
      content?.explanation,
      content?.correctSentence,
      content?.correctExplanation,
      raw?.answerExplanation
    );

    return { kind: "OX", question, correct, user, explanation };
  }

  // MULTIPLE CHOICE
  if (quizType.includes("MULTIPLE") || quizType.includes("CHOICE") || quizType.includes("MCQ")) {
    const correct = normalizeChoiceLabel(content?.correctAnswer ?? content?.answer ?? raw?.correctAnswer);
    if (!question || !correct) return null;

    const rawOptions = content?.options ?? content?.choices ?? [];
    const options: { label: string; text: string }[] = Array.isArray(rawOptions)
      ? rawOptions.map((o: any, idx: number) => ({
          label: String(o?.label ?? String.fromCharCode(65 + idx)),
          text: String(o?.text ?? o?.value ?? o ?? ""),
        }))
      : [];

    const user =
      normalizeChoiceLabel(content?.userAnswer?.value) ??
      normalizeChoiceLabel(content?.userAnswer) ??
      normalizeChoiceLabel(raw?.userAnswer?.value) ??
      normalizeChoiceLabel(raw?.userAnswer);

    const explanation = pickFirstString(content?.answerExplanation, content?.explanation, raw?.answerExplanation);

    return { kind: "MCQ", question, options, correct, user, explanation };
  }

  return null;
}

export default function ReviewNotesPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const date = sp.get("date"); // optional

  const [loading, setLoading] = useState(true);
  const [wrong, setWrong] = useState<NormalizedQuiz[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        let url = "/api/my/review-notes";
        if (date) url += `?date=${encodeURIComponent(date)}`;

        const res = await api.get<ApiResponse<any>>(url);
        const d = res.data?.data ?? {};

        const rawList = (d.reviewNotes ?? d.quizzes ?? d.items ?? []) as any[];
        const normalized = Array.isArray(rawList)
          ? rawList.map(normalizeItem).filter(Boolean) as NormalizedQuiz[]
          : [];

        // ✅ 1) 서버가 isCorrect 같은 flag를 주면 그걸 우선
        // ✅ 2) 없으면 프론트에서 user/correct 비교로 판별
        const wrongOnly = normalized.filter((q, i) => {
          const raw = rawList?.[i];
          const flag =
            raw?.isCorrect ?? raw?.correct ?? raw?.isAnswerCorrect ?? raw?.result;

          if (typeof flag === "boolean") return flag === false;

          const computed = computeIsCorrect(q);
          // 판별 가능하면 틀린 것만, 판별 불가면 일단 포함(“복습노트가 비어보이는 문제” 방지)
          if (typeof computed === "boolean") return computed === false;
          return true;
        });

        setWrong(wrongOnly);
        setIdx(0);
        setPicked(null);
      } catch (e) {
        console.error("[review-notes]", e);
        setWrong([]);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [date]);

  const total = wrong.length;
  const cur = wrong[idx];

  const pages = useMemo(() => Array.from({ length: Math.max(1, total) }, (_, i) => i + 1), [total]);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <header className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => nav(-1)} aria-label="뒤로가기">
            <img src="/icons/fluent_ios-arrow.svg" alt="" />
          </button>
          <h1 className={styles.title}>복습 노트</h1>
          <div className={styles.rightDummy} />
        </header>

        <div className={styles.pageNav}>
          <button className={styles.navArrow} onClick={() => setIdx((p) => Math.max(0, p - 1))} disabled={idx <= 0}>
            ◀
          </button>

          <div className={styles.pageNums}>
            {pages.map((n, i) => (
              <button
                key={n}
                className={`${styles.pageNum} ${i === idx ? styles.pageNumActive : ""}`}
                onClick={() => { setIdx(i); setPicked(null); }}
              >
                {n}
              </button>
            ))}
          </div>

          <button className={styles.navArrow} onClick={() => setIdx((p) => Math.min(total - 1, p + 1))} disabled={idx >= total - 1}>
            ▶
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>불러오는 중...</p>
        ) : total === 0 ? (
          <p className={styles.empty}>틀린 문제가 없어요.</p>
        ) : !cur ? (
          <p className={styles.empty}>문제가 없어요.</p>
        ) : (
          <div className={styles.card}>
            {cur.kind === "OX" ? (
              <>
                <div className={styles.question}>{cur.question}</div>
                <div className={styles.oxRow}>
                  <button
                    className={`${styles.oxBtn} ${picked === "O" ? styles.oxActive : ""}`}
                    onClick={() => setPicked("O")}
                  >
                    O
                  </button>
                  <button
                    className={`${styles.oxBtn} ${picked === "X" ? styles.oxActive : ""}`}
                    onClick={() => setPicked("X")}
                  >
                    X
                  </button>
                </div>
                {picked && (
                  <div className={styles.answerLine}>
                    {cur.explanation ? cur.explanation : `정답: ${cur.correct}`}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.question}>{cur.question}</div>
                <div className={styles.mcList}>
                  {cur.options.map((o) => (
                    <button
                      key={o.label}
                      className={`${styles.mcOption} ${picked === o.label ? styles.mcActive : ""}`}
                      onClick={() => setPicked(o.label)}
                    >
                      <span className={styles.mcLabel}>{o.label}</span>
                      <span className={styles.mcText}>{o.text}</span>
                    </button>
                  ))}
                </div>
                {picked && (
                  <div className={styles.answerLine}>
                    {cur.explanation ? cur.explanation : `정답: ${cur.correct}`}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className={styles.bottomSpace} />
      </div>

      <BottomNav activeTab="mypage" />
    </div>
  );
}

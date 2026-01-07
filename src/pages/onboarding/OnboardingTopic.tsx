// src/pages/onboarding/OnboardingTopic.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./OnboardingTopic.module.css";
import api from "@/api/axiosInstance";

// 🔹 노출 키워드 (한글)
const ALL_TOPICS = ["정치", "경제", "사회", "국제"];

export default function OnboardingTopic() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggle = (t: string) => {
    setError("");
    setSelected((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleNext = async () => {
    if (selected.length === 0) {
      setError("최소 1개는 선택해야 합니다");
      return;
    }

    // ✅ 백엔드 스펙: Body는 String array (예: ["정치", "경제"])
    const selectedTopics = selected;

    setSubmitting(true);
    setError("");

    try {
      await api.post("/api/onboard/topics", selectedTopics);

      nav("/onboarding/alarm", {
        state: { topics: selectedTopics },
      });
    } catch (e) {
      console.error("[OnboardingTopic] post topics error:", e);
      setError("토픽 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.topicHeader}>
          <h1 className={styles.topicTitle}>
            안녕하세요 이화연 님,
            <br />
            관심이 가는 토픽을 선택해주세요.
          </h1>
          <p className={styles.topicSub}>
            선택한 토픽 기준으로 뉴스를 추천해드려요.
            <br />
            언제든 설정에서 변경할 수 있어요.
          </p>
        </div>

        <div className={styles.pillGrid}>
          {ALL_TOPICS.map((t) => {
            const sel = selected.includes(t);
            return (
              <button
                key={t}
                type="button"
                className={`${styles.pill} ${sel ? styles.pillSelected : ""}`}
                onClick={() => toggle(t)}
                aria-pressed={sel}
              >
                {t}
              </button>
            );``
          })}
        </div>

        {error && (
          <div
            className={`${styles.noticeBox} ${styles.noticeError}`}
            role="status"
            aria-live="polite"
          >
            <span className={styles.noticeIcon} aria-hidden>
              ⓘ
            </span>
            <span className={styles.noticeText}>{error}</span>
          </div>
        )}

        <button
          className={styles.nextButton}
          onClick={handleNext}
          disabled={submitting}
        >
          {submitting ? "저장 중..." : "계속하기"}
        </button>
      </div>
    </div>
  );
}

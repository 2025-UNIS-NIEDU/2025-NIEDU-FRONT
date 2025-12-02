// src/pages/onboarding/OnboardingTopic.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./OnboardingTopic.module.css";
import { apiFetch } from "@/lib/apiClient";

// 🔹 노출 키워드 (한글)
const ALL_TOPICS = ["정치", "경제", "사회", "국제"];

// 🔹 백엔드로 보낼 코드 매핑
const TOPIC_CODE_MAP = {
  정치: "politics",
  경제: "economy",
  사회: "society",
  국제: "world",
} as const;

export default function OnboardingTopic() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  const toggle = (t: string) => {
    setError(""); // 사용자가 조작하면 에러 초기화
    setSelected((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleNext = () => {
    if (selected.length === 0) {
      setError("최소 1개는 선택해야 합니다");
      return;
    }

    // ✅ 토픽 API 호출 (선택된 키워드 → 코드 배열로 변환)
    (async () => {
      try {
        const topicCodes = selected.map(
          (t) => TOPIC_CODE_MAP[t as keyof typeof TOPIC_CODE_MAP]
        );

        await apiFetch("/api/onboard/topics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topics: topicCodes }),
        });
      } catch (e) {
        console.error("토픽 API 호출 실패:", e);
        // 실패하더라도 온보딩 흐름은 계속 진행
      } finally {
        nav("/onboarding/alarm", { state: { topics: selected } });
      }
    })();
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
            );
          })}
        </div>

        {/* 🔻 에러가 있을 때만 표시 */}
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
        >
          계속하기
        </button>
      </div>
    </div>
  );
}

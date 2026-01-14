// src/pages/MyPage/Settings/PreferredTopicsPage.tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./PreferredTopicsPage.module.css";

const TOPICS = ["정치", "경제", "사회", "국제", "IT 과학"] as const;
type Topic = (typeof TOPICS)[number];

const LS_KEY = "niedu_preferred_topics";

function loadSelected(): Topic[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => TOPICS.includes(x));
  } catch {
    return [];
  }
}

export default function PreferredTopicsPage() {
  const nav = useNavigate();
  const location = useLocation() as any;
  const isModal = Boolean(location.state?.backgroundLocation);

  const [selected, setSelected] = useState<Topic[]>(() => loadSelected());

  const toggle = (t: Topic) => {
    setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const save = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(selected));
    // ✅ 저장하면 모달 닫히기
    nav(-1);
  };

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.dimBg} />

        <div className={styles.sheet} role="dialog" aria-modal="true">
          <div className={styles.grabber} />
          <div className={styles.sheetTitle}>선호 토픽 설정</div>

          <div className={styles.chips}>
            {TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.chip} ${selectedSet.has(t) ? styles.chipOn : ""}`}
                onClick={() => toggle(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <button className={styles.saveBtn} type="button" onClick={save}>
            저장하기
          </button>
        </div>

        {/* 모달로 열렸을 땐 뒤에 Settings의 하단바가 보이니까 중복 렌더링 X */}
        {!isModal && <BottomNav activeTab="mypage" />}

        <button className={styles.backTap} type="button" onClick={() => nav(-1)} aria-label="닫기" />
      </div>
    </div>
  );
}

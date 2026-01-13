// src/pages/MyPage/Settings/PreferredTopicsPage.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    return arr.filter((t) => TOPICS.includes(t)) as Topic[];
  } catch {
    return [];
  }
}

export default function PreferredTopicsPage() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<Topic[]>(() => loadSelected());
  const [saved, setSaved] = useState(false);

  const toggle = (t: Topic) => {
    setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const save = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(selected));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const ordered = useMemo(() => TOPICS.map((t) => ({ t, on: selected.includes(t) })), [selected]);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.dimBg} />

        <div className={styles.sheet}>
          <div className={styles.grabber} />
          <div className={styles.sheetTitle}>선호 토픽 설정</div>

          <div className={styles.chips}>
            {ordered.map(({ t, on }) => (
              <button
                key={t}
                type="button"
                className={`${styles.chip} ${on ? styles.chipOn : ""}`}
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

        {saved && <div className={styles.savedToast}>저장되었습니다</div>}

        <button className={styles.backTap} type="button" onClick={() => nav(-1)} aria-label="닫기" />
        <BottomNav activeTab="mypage" />
      </div>
    </div>
  );
}

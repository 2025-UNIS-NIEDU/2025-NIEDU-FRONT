// src/pages/MyPage/Settings/PushAlarmPage.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./PushAlarmPage.module.css";

type AlarmItem = {
  id: string;
  time: string; // HH:mm
};

const LS_KEY = "niedu_push_times";

function loadTimes(): AlarmItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw)
      return [
        { id: "1", time: "08:00" },
        { id: "2", time: "22:00" },
      ];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.time === "string")
      .map((x, idx) => ({ id: String(x.id ?? idx), time: x.time }));
  } catch {
    return [
      { id: "1", time: "08:00" },
      { id: "2", time: "22:00" },
    ];
  }
}

function saveTimes(items: AlarmItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function toAmPmLabel(time: string) {
  const [hhStr, mmStr] = time.split(":");
  const hh = Number(hhStr);
  const mm = Number(mmStr);
  const isPm = hh >= 12;
  const h12 = ((hh + 11) % 12) + 1;
  const mm2 = String(isNaN(mm) ? 0 : mm).padStart(2, "0");
  return `${isPm ? "PM" : "AM"} ${String(h12).padStart(2, "0")}:${mm2}`;
}

export default function PushAlarmPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<AlarmItem[]>(() => loadTimes());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTime, setDraftTime] = useState("08:00");
  const [saved, setSaved] = useState(false);

  const openEdit = (id: string) => {
    const t = items.find((x) => x.id === id)?.time ?? "08:00";
    setDraftTime(t);
    setEditingId(id);
  };

  const applyEdit = () => {
    if (!editingId) return;
    setItems((prev) => prev.map((x) => (x.id === editingId ? { ...x, time: draftTime } : x)));
    setEditingId(null);
  };

  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  const add = () => {
    const id = String(Date.now());
    setItems((prev) => [...prev, { id, time: "20:00" }]);
  };

  const sorted = useMemo(() => [...items].sort((a, b) => a.time.localeCompare(b.time)), [items]);

  const save = () => {
    saveTimes(sorted);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.dimBg} />

        <div className={styles.sheet}>
          <div className={styles.grabber} />
          <div className={styles.sheetTitle}>푸시 알림 설정</div>

          <div className={styles.list}>
            {sorted.map((it) => (
              <div key={it.id} className={styles.row}>
                <div className={styles.time}>{toAmPmLabel(it.time)}</div>
                <button className={styles.iconBtn} type="button" onClick={() => openEdit(it.id)}>
                  <img src="/icons/icon-pen.svg" alt="수정" />
                </button>
                <button className={styles.iconBtn} type="button" onClick={() => remove(it.id)}>
                  <img src="/icons/icon-trash.svg" alt="삭제" />
                </button>
              </div>
            ))}
          </div>

          <button className={styles.addBtn} type="button" onClick={add}>
            + 알림 추가
          </button>

          <button className={styles.saveBtn} type="button" onClick={save} disabled={sorted.length === 0}>
            저장하기
          </button>
        </div>

        {editingId && (
          <div className={styles.pickerDim} role="presentation" onClick={() => setEditingId(null)}>
            <div className={styles.pickerBox} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <div className={styles.pickerTitle}>시간 선택</div>
              <input
                className={styles.timeInput}
                type="time"
                value={draftTime}
                onChange={(e) => setDraftTime(e.target.value)}
              />
              <div className={styles.pickerBtns}>
                <button className={styles.pickerCancel} type="button" onClick={() => setEditingId(null)}>
                  취소
                </button>
                <button className={styles.pickerOk} type="button" onClick={applyEdit}>
                  적용
                </button>
              </div>
            </div>
          </div>
        )}

        {saved && <div className={styles.savedToast}>저장되었습니다</div>}

        <button className={styles.backTap} type="button" onClick={() => nav(-1)} aria-label="닫기" />
        <BottomNav activeTab="mypage" />
      </div>
    </div>
  );
}

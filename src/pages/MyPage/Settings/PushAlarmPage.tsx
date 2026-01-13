// src/pages/MyPage/Settings/PushAlarmPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toAmPmLabel(time: string) {
  const [hhStr, mmStr] = time.split(":");
  const hh = Number(hhStr);
  const mm = Number(mmStr);
  const isPm = hh >= 12;
  const h12 = ((hh + 11) % 12) + 1;
  const mm2 = pad2(Number.isNaN(mm) ? 0 : mm);
  return `${isPm ? "PM" : "AM"} ${pad2(h12)}:${mm2}`;
}

function parseToPicker(time: string) {
  const [hhStr, mmStr] = time.split(":");
  const hh24 = Math.max(0, Math.min(23, Number(hhStr)));
  const mm = Math.max(0, Math.min(59, Number(mmStr)));
  const isPm = hh24 >= 12;
  const h12 = ((hh24 + 11) % 12) + 1;
  return { ampm: isPm ? "PM" : "AM", hour12: h12, minute: mm };
}

function pickerToTime(ampm: "AM" | "PM", hour12: number, minute: number) {
  const h = Math.max(1, Math.min(12, hour12));
  const m = Math.max(0, Math.min(59, minute));
  let hh24 = h % 12;
  if (ampm === "PM") hh24 += 12;
  return `${pad2(hh24)}:${pad2(m)}`;
}

type WheelColumnProps = {
  values: number[] | string[];
  value: number | string;
  onChange: (v: any) => void;
};

function WheelColumn({ values, value, onChange }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const itemH = 36;
  const padding = itemH * 2; // 위/아래 2칸 여백(가운데 맞추기)

  const idx = useMemo(() => values.findIndex((v) => String(v) === String(value)), [values, value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const top = idx < 0 ? 0 : idx * itemH;
    el.scrollTop = top;
  }, [idx]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let t: number | null = null;

    const snap = () => {
      if (!el) return;
      const raw = el.scrollTop;
      const nearest = Math.round(raw / itemH);
      const clamped = Math.max(0, Math.min(values.length - 1, nearest));
      const target = clamped * itemH;
      el.scrollTo({ top: target, behavior: "smooth" });
      onChange(values[clamped]);
    };

    const onScroll = () => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(snap, 90);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (t) window.clearTimeout(t);
    };
  }, [values, onChange]);

  return (
    <div className={styles.wheelCol}>
      <div className={styles.wheelFadeTop} />
      <div className={styles.wheelFadeBottom} />
      <div
        ref={ref}
        className={styles.wheelScroll}
        style={{ paddingTop: padding, paddingBottom: padding }}
      >
        {values.map((v) => {
          const active = String(v) === String(value);
          return (
            <div
              key={String(v)}
              className={`${styles.wheelItem} ${active ? styles.wheelItemActive : ""}`}
              onClick={() => onChange(v)}
              role="button"
              tabIndex={0}
            >
              {typeof v === "number" ? pad2(v) : v}
            </div>
          );
        })}
      </div>
      <div className={styles.wheelCenterLine} />
    </div>
  );
}

export default function PushAlarmPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<AlarmItem[]>(() => loadTimes());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM");
  const [hour12, setHour12] = useState<number>(8);
  const [minute, setMinute] = useState<number>(0);

  const [saved, setSaved] = useState(false);

  const sorted = useMemo(() => [...items].sort((a, b) => a.time.localeCompare(b.time)), [items]);

  const openEdit = (id: string) => {
    const t = items.find((x) => x.id === id)?.time ?? "08:00";
    const p = parseToPicker(t);
    setAmpm(p.ampm as "AM" | "PM");
    setHour12(p.hour12);
    setMinute(p.minute);
    setEditingId(id);
  };

  const applyEdit = () => {
    if (!editingId) return;
    const newTime = pickerToTime(ampm, hour12, minute);
    setItems((prev) => prev.map((x) => (x.id === editingId ? { ...x, time: newTime } : x)));
    setEditingId(null);
  };

  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  const save = () => {
    // 저장 시에는 1번째 스샷처럼 "수정 UI(다이얼)" 닫힌 상태로 보여야 함
    setEditingId(null);
    saveTimes([...items].sort((a, b) => a.time.localeCompare(b.time)));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  const H12 = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const MM = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* ✅ 뒤 배경이 #F2F2F7로 “투명하게” 비치도록 */}
        <div className={styles.dimBg} />

        <div className={styles.sheet}>
          <div className={styles.grabber} />
          <div className={styles.sheetTitle}>푸시 알림 설정</div>

          <div className={styles.list}>
            {sorted.map((it) => (
              <div key={it.id} className={styles.row}>
                <div className={styles.time}>{toAmPmLabel(it.time)}</div>

                <button className={styles.iconBtn} type="button" onClick={() => openEdit(it.id)}>
                  <img src="/icons/fluent_edit-20-filled.svg" alt="수정" />
                </button>

                <button className={styles.iconBtn} type="button" onClick={() => remove(it.id)}>
                  <img src="/icons/Vector (1).svg" alt="삭제" />
                </button>
              </div>
            ))}
          </div>

          {/* ✅ 알림 추가 버튼 제거 (요청사항) */}

          {/* ✅ 펜 누르면 “다이얼(휠)”처럼 터치/스크롤로 수정 */}
          {editingId && (
            <div className={styles.pickerInline}>
              <div className={styles.pickerInner}>
                <WheelColumn values={H12} value={hour12} onChange={(v: number) => setHour12(v)} />
                <WheelColumn values={MM} value={minute} onChange={(v: number) => setMinute(v)} />
                <WheelColumn
                  values={["AM", "PM"]}
                  value={ampm}
                  onChange={(v: "AM" | "PM") => setAmpm(v)}
                />
              </div>

              <div className={styles.pickerBtns}>
                <button className={styles.pickerCancel} type="button" onClick={() => setEditingId(null)}>
                  취소
                </button>
                <button className={styles.pickerOk} type="button" onClick={applyEdit}>
                  적용
                </button>
              </div>
            </div>
          )}

          <button className={styles.saveBtn} type="button" onClick={save} disabled={items.length === 0}>
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

// src/pages/MyPage/Settings/PushAlarmPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./PushAlarmPage.module.css";

type AlarmItem = {
  id: string;
  time: string; // HH:mm (24h)
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

function toPickerState(time24: string) {
  const [hhStr, mmStr] = time24.split(":");
  const hh = Number(hhStr);
  const mm = Number(mmStr);
  const isPm = hh >= 12;
  const h12 = ((hh + 11) % 12) + 1; // 1~12
  return {
    hour12: String(h12).padStart(2, "0"),
    minute: String(isNaN(mm) ? 0 : mm).padStart(2, "0"),
    period: isPm ? "PM" : "AM",
  } as const;
}

function toTime24(hour12: string, minute: string, period: "AM" | "PM") {
  const h = Number(hour12); // 1~12
  const m = Number(minute);
  let hh = h % 12; // 12 -> 0
  if (period === "PM") hh += 12;
  const hh2 = String(hh).padStart(2, "0");
  const mm2 = String(isNaN(m) ? 0 : m).padStart(2, "0");
  return `${hh2}:${mm2}`;
}

/**
 * ✅ 세번째 스샷처럼: 3컬럼 휠(시/분/AMPM) + PC 스크롤 가능
 * - 무한 루프 느낌: 배열을 3번 반복 + 스크롤이 끝쪽 가면 중앙으로 점프
 */
function WheelColumn({
  values,
  value,
  onChange,
  ariaLabel,
}: {
  values: string[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  const ITEM_H = 44;
  const repeat = 3;
  const repeated = useMemo(() => Array.from({ length: repeat }, () => values).flat(), [values]);
  const midStart = values.length; // 1회차 시작 index
  const ref = useRef<HTMLDivElement | null>(null);
  const ticking = useRef<number | null>(null);

  // 초기 스크롤: 중앙 회차 + 선택값 위치
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = values.indexOf(value);
    const targetIndex = midStart + Math.max(0, idx);
    el.scrollTop = targetIndex * ITEM_H;
  }, [value, values, midStart]);

  const normalizeIfNeeded = () => {
    const el = ref.current;
    if (!el) return;

    const rawIndex = Math.round(el.scrollTop / ITEM_H);
    const len = values.length;

    // 가운데 회차(1회차)에서 크게 벗어나면 중앙으로 점프
    if (rawIndex < len * 0.5 || rawIndex > len * 2.5) {
      const currentVal = repeated[Math.max(0, Math.min(repeated.length - 1, rawIndex))];
      const base = values.indexOf(currentVal);
      const newIndex = midStart + Math.max(0, base);
      el.scrollTop = newIndex * ITEM_H;
    }
  };

  const commitNearest = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const v = repeated[Math.max(0, Math.min(repeated.length - 1, idx))];
    if (v && v !== value) onChange(v);
    normalizeIfNeeded();
  };

  const onScroll = () => {
    if (ticking.current) window.cancelAnimationFrame(ticking.current);
    ticking.current = window.requestAnimationFrame(() => {
      commitNearest();
      ticking.current = null;
    });
  };

  return (
    <div className={styles.wheelCol} aria-label={ariaLabel}>
      <div className={styles.wheelMaskTop} />
      <div className={styles.wheelMaskBottom} />
      <div className={styles.wheelCenterLine} />

      <div
        ref={ref}
        className={styles.wheelList}
        onScroll={onScroll}
        role="listbox"
        aria-label={ariaLabel}
      >
        {/* 위/아래 여백(중앙 맞춤) */}
        <div style={{ height: ITEM_H * 2 }} />
        {repeated.map((v, i) => (
          <div
            key={`${v}-${i}`}
            className={`${styles.wheelItem} ${v === value ? styles.wheelItemOn : ""}`}
            style={{ height: ITEM_H }}
            role="option"
            aria-selected={v === value}
          >
            {v}
          </div>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}

export default function PushAlarmPage() {
  const nav = useNavigate();
  const location = useLocation() as any;
  const isModal = Boolean(location.state?.backgroundLocation);

  const [items, setItems] = useState<AlarmItem[]>(() => loadTimes());
  const [editingId, setEditingId] = useState<string | null>(null);

  const [hour12, setHour12] = useState("08");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  const openEdit = (id: string) => {
    const t = items.find((x) => x.id === id)?.time ?? "08:00";
    const s = toPickerState(t);
    setHour12(s.hour12);
    setMinute(s.minute);
    setPeriod(s.period);
    setEditingId(id);
  };

  const applyEdit = () => {
    if (!editingId) return;
    const newTime = toTime24(hour12, minute, period);
    setItems((prev) => prev.map((x) => (x.id === editingId ? { ...x, time: newTime } : x)));
    setEditingId(null);
  };

  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  const sorted = useMemo(() => [...items].sort((a, b) => a.time.localeCompare(b.time)), [items]);

  const save = () => {
    saveTimes(sorted);
    nav(-1); // ✅ 저장하면 첫번째 스샷처럼 목록만 보이도록 닫기
  };

  const HOURS = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")), []);
  const MINUTES = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")), []);
  const PERIODS = useMemo(() => ["AM", "PM"], []);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* ✅ 배경 투명: settings 화면이 보이게 */}
        <button className={styles.dimBg} type="button" onClick={() => nav(-1)} aria-label="닫기" />

        <div className={styles.sheet} role="dialog" aria-modal="true">
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

          {/* ✅ 세번째 스샷처럼: 편집 시 아래에 휠 UI가 “카드”로 펼쳐짐 */}
          {editingId && (
            <div className={styles.pickerCard}>
              <div className={styles.pickerInner}>
                <div className={styles.wheelWrap}>
                  <WheelColumn values={HOURS} value={hour12} onChange={setHour12} ariaLabel="시" />
                  <WheelColumn values={MINUTES} value={minute} onChange={setMinute} ariaLabel="분" />
                  <WheelColumn
                    values={PERIODS}
                    value={period}
                    onChange={(v) => setPeriod(v as "AM" | "PM")}
                    ariaLabel="오전오후"
                  />
                </div>
              </div>
            </div>
          )}

          {editingId && (
            <div className={styles.pickerBtns}>
              <button className={styles.pickerCancel} type="button" onClick={() => setEditingId(null)}>
                취소
              </button>
              <button className={styles.pickerOk} type="button" onClick={applyEdit}>
                적용
              </button>
            </div>
          )}

          <button className={styles.saveBtn} type="button" onClick={save} disabled={sorted.length === 0}>
            저장하기
          </button>
        </div>

        {/* ✅ 모달로 뜬 상태면 뒤의 Settings에 BottomNav가 이미 있음 → 중복 X */}
        {!isModal && <BottomNav activeTab="mypage" />}
      </div>
    </div>
  );
}

// src/pages/MyPage/Settings/PushAlarmPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PushAlarmPage.module.css";

type AlarmItem = { id: string; time: string }; // HH:mm
const LS_KEY = "niedu_push_times";

function loadTimes(): AlarmItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [{ id: "1", time: "08:00" }, { id: "2", time: "22:00" }];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.time === "string")
      .map((x, idx) => ({ id: String(x.id ?? idx), time: x.time }));
  } catch {
    return [{ id: "1", time: "08:00" }, { id: "2", time: "22:00" }];
  }
}

function saveTimes(items: AlarmItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

const pad2 = (n: number) => String(n).padStart(2, "0");

function toAmPmLabel(time: string) {
  const [hhStr, mmStr] = time.split(":");
  const hh = Number(hhStr);
  const mm = Number(mmStr);
  const isPm = hh >= 12;
  const h12 = ((hh + 11) % 12) + 1;
  return `${isPm ? "PM" : "AM"} ${pad2(h12)}:${pad2(mm)}`;
}

function parseToPicker(time: string) {
  const [hhStr, mmStr] = time.split(":");
  const hh24 = Math.max(0, Math.min(23, Number(hhStr)));
  const mm = Math.max(0, Math.min(59, Number(mmStr)));
  const isPm = hh24 >= 12;
  const h12 = ((hh24 + 11) % 12) + 1;
  return { ampm: isPm ? ("PM" as const) : ("AM" as const), hour12: h12, minute: mm };
}

function pickerToTime(ampm: "AM" | "PM", hour12: number, minute: number) {
  const h = Math.max(1, Math.min(12, hour12));
  const m = Math.max(0, Math.min(59, minute));
  let hh24 = h % 12;
  if (ampm === "PM") hh24 += 12;
  return `${pad2(hh24)}:${pad2(m)}`;
}

/** ✅ 무한(루프) 휠 */
function useLoopValues<T>(base: T[]) {
  return useMemo(() => [...base, ...base, ...base], [base]);
}

type WheelLoopProps<T> = {
  base: T[];
  value: T;
  onChange: (v: T) => void;
  render?: (v: T) => React.ReactNode;
};

function WheelLoop<T extends string | number>({ base, value, onChange, render }: WheelLoopProps<T>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const itemH = 36;
  const pad = itemH * 2;
  const values = useLoopValues(base);
  const baseLen = base.length;

  const baseIndex = useMemo(() => {
    const i = base.findIndex((v) => String(v) === String(value));
    return i < 0 ? 0 : i;
  }, [base, value]);

  // ✅ 가운데(2번째 세트)에서 시작
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = baseIndex + baseLen; // middle set
    el.scrollTop = idx * itemH;
  }, [baseIndex, baseLen]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let t: number | null = null;
    const getNearest = () => Math.round(el.scrollTop / itemH);

    const normalizeToMiddle = (idx: number) => {
      // idx가 첫번째/세번째 세트로 치우치면 같은 값의 middle로 순간이동
      const baseIdx = ((idx % baseLen) + baseLen) % baseLen;
      const middleIdx = baseIdx + baseLen;
      el.scrollTop = middleIdx * itemH;
      return middleIdx;
    };

    const snap = () => {
      const idx = getNearest();
      const norm = normalizeToMiddle(idx);
      const picked = values[norm] as T;
      onChange(picked);
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
  }, [values, baseLen, onChange]);

  return (
    <div className={styles.wheelCol}>
      <div className={styles.wheelFadeTop} />
      <div className={styles.wheelFadeBottom} />
      <div ref={ref} className={styles.wheelScroll} style={{ paddingTop: pad, paddingBottom: pad }}>
        {values.map((v, i) => {
          const active = String(v) === String(value) && i >= baseLen && i < baseLen * 2;
          return (
            <div
              key={`${String(v)}-${i}`}
              className={`${styles.wheelItem} ${active ? styles.wheelItemActive : ""}`}
              onClick={() => onChange(v as T)}
              role="button"
              tabIndex={0}
            >
              {render ? render(v as T) : typeof v === "number" ? pad2(v) : String(v)}
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

  const sorted = useMemo(() => [...items].sort((a, b) => a.time.localeCompare(b.time)), [items]);

  const openEdit = (id: string) => {
    const t = items.find((x) => x.id === id)?.time ?? "08:00";
    const p = parseToPicker(t);
    setAmpm(p.ampm);
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
    setEditingId(null);
    saveTimes([...items].sort((a, b) => a.time.localeCompare(b.time)));
    nav(-1); // ✅ 저장하면 첫번째 스샷처럼 Settings 뒤로 돌아가게
  };

  const H12 = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const MM = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  return (
    <div className={styles.modalRoot}>
      {/* ✅ SettingsPage가 그대로 보이는 상태에서 dim + sheet만 위로 */}
      <button className={styles.dimBg} type="button" onClick={() => nav(-1)} aria-label="닫기" />

      <div className={styles.sheet} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
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

        {editingId && (
          <div className={styles.pickerInline}>
            {/* ✅ 스샷처럼 “붙어있게” (gap 거의 없음) */}
            <div className={styles.pickerRow}>
              <WheelLoop base={H12} value={hour12} onChange={setHour12} render={(v) => pad2(Number(v))} />
              <WheelLoop base={MM} value={minute} onChange={setMinute} render={(v) => pad2(Number(v))} />
              <WheelLoop base={["AM", "PM"]} value={ampm} onChange={setAmpm} />
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
    </div>
  );
}

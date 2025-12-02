import { create } from "zustand";

type SessionState = {
  startedAt?: number;
  finishedAt?: number;
  streakDays: number;
  start: () => void;
  finish: () => void;
  getDurationLabel: () => string;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  streakDays: 2,
  start: () => set({ startedAt: Date.now(), finishedAt: undefined }),
  finish: () => set({ finishedAt: Date.now() }),
  getDurationLabel: () => {
    const { startedAt, finishedAt } = get();
    if (!startedAt || !finishedAt) return "0초";
    const sec = Math.floor((finishedAt - startedAt) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${s}초`;
  },
}));

// src/hooks/useGoToDetail.ts
import { useNavigate } from "react-router-dom";

export function useGoToDetail() {
  const nav = useNavigate();

  return (articleId: string | number, opts?: { from?: string }) => {
    const idStr = String(articleId);
    const q = opts?.from ? `?from=${encodeURIComponent(opts.from)}` : "";
    const path = `/article/${idStr}${q}`;
    console.log("[useGoToDetail] go to", path);
    nav(path);
  };
}

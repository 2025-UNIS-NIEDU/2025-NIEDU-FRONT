// src/hooks/useGoToDetail.ts
import { useNavigate } from "react-router-dom";

export function useGoToDetail() {
  const nav = useNavigate();

  return (articleId: string, opts?: { from?: string }) => {
    // 필요하면 어디서 왔는지 쿼리로 넘기기
    const q = opts?.from ? `?from=${encodeURIComponent(opts.from)}` : "";
    // 👉 코스 디테일 페이지로 이동
    nav(`/article/${articleId}${q}`);
  };
}

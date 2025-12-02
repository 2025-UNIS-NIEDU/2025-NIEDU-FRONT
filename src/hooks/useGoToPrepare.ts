import { useNavigate } from "react-router-dom";

export function useGoToPrepare() {
  const nav = useNavigate();
  return (articleId: string, opts?: { from?: string }) => {
    const q = opts?.from ? `?from=${encodeURIComponent(opts.from)}` : "";
    nav(`/article/${articleId}/prepare${q}`);
  };
}
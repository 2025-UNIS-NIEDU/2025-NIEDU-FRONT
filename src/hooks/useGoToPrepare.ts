// src/hooks/useGoToPrepare.ts
import { useNavigate } from "react-router-dom";

export type PrepareOptions = {
  sessionId?: number;
  title?: string;
  articleUrl?: string; // ✅ 추가
};

export function useGoToPrepare() {
  const nav = useNavigate();

  return (articleId: string | number, opts?: PrepareOptions) => {
    nav(`/article/${articleId}/prepare`, {
      state: {
        sessionId: opts?.sessionId,
        articleTitle: opts?.title,
        articleUrl: opts?.articleUrl, // ✅ 전달
      },
    });
  };
}

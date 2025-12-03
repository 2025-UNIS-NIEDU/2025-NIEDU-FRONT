// src/hooks/useGoToPrepare.ts
import { useNavigate } from "react-router-dom";

type PrepareOptions = {
  sessionId?: number;
  title?: string;
};

export function useGoToPrepare() {
  const nav = useNavigate();

  return (articleId: string | number, opts?: PrepareOptions) => {
    nav(`/article/${articleId}/prepare`, {
      state: {
        sessionId: opts?.sessionId,
        articleTitle: opts?.title,
      },
    });
  };
}

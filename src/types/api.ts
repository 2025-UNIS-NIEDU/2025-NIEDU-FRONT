// src/types/api.ts
export type TodayNewsItem = {
  thumbnailUrl: string;
  title: string;
  publisher: string;
  topic: string;
};

export type ApiResponse<T> = {
  success: boolean;
  status: number;
  message: string;
  data: T;
};

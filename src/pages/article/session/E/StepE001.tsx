// src/pages/article/session/E/StepE001.tsx

import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EduBottomBar from "@/components/edu/EduBottomBar";
import { submitStepAnswer } from "@/lib/apiClient";
import type { StepMeta } from "@/pages/article/ArticlePrepare";
import styles from "./StepE001.module.css";

// 🔹 패키지 JSON 가져오기
import economyPackage from "@/data/economy_2025-11-24_package.json";

type Props = {
  articleId?: string;
  articleUrl?: string;
  stepMeta?: StepMeta; // /start 응답에서 넘어오는 메타
};

type ArticleReadingContent = {
  thumbnailUrl: string;
  headline: string;
  publisher: string;
  publishedAt: string;
  sourceUrl: string;
};

type LocationState = {
  articleId?: string;
  articleTitle?: string;
  articleSource?: string;
  articlePublishedAt?: string;
  articleImageUrl?: string;
  articleUrl?: string;
  nextStepPath?: string;
};

// 🔹 실제 JSON 구조에 맞춘 타입 (courses → sessions)
type EconomyJson = {
  courses: {
    courseId: number;
    topic: string;
    subTopic: string;
    subTags: string[];
    courseName: string;
    courseDescription: string;
    sessions: {
      sessionId: number;
      headline?: string;
      publishedAt?: string;
      thumbnailUrl?: string;
      publisher?: string;
      sourceUrl?: string;
      // 나머지 필드는 안 써서 생략
    }[];
  }[];
};

const economyData = economyPackage as EconomyJson;

// 🔹 1번 코스의 1번 세션을 ARTICLE_READING 용으로 사용
const I_ARTICLE_READING_FROM_PACKAGE: ArticleReadingContent | undefined =
  economyData.courses?.[0]?.sessions?.[0]
    ? {
        thumbnailUrl:
          economyData.courses[0].sessions[0].thumbnailUrl ?? "",
        headline:
          economyData.courses[0].sessions[0].headline ??
          "선택한 기사 제목이 없습니다.",
        publisher:
          economyData.courses[0].sessions[0].publisher ?? "언론사",
        publishedAt:
          economyData.courses[0].sessions[0].publishedAt ?? "발행일",
        sourceUrl:
          economyData.courses[0].sessions[0].sourceUrl ??
          "https://www.busan.com/view/busan/view.php?code=2025112419192890066",
      }
    : undefined;

export default function StepI001({ articleId, articleUrl, stepMeta }: Props) {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: LocationState };

  // 1순위: 백엔드 stepMeta.content
  const contentFromMeta = stepMeta?.content as
    | ArticleReadingContent
    | undefined;

  // 2순위: 패키지 JSON
  // 3순위: location state
  const mergedContent: ArticleReadingContent =
    contentFromMeta ??
    I_ARTICLE_READING_FROM_PACKAGE ??
    ({
      thumbnailUrl: state?.articleImageUrl ?? "",
      headline:
        state?.articleTitle ?? "선택한 기사 제목이 없습니다.",
      publisher: state?.articleSource ?? "언론사",
      publishedAt: state?.articlePublishedAt ?? "발행일",
      sourceUrl:
        state?.articleUrl ??
        articleUrl ??
        "https://www.busan.com/view/busan/view.php?code=2025112419192890066",
    } as ArticleReadingContent);

  const thumbnailUrl = mergedContent.thumbnailUrl;
  const headline = mergedContent.headline;
  const publisher = mergedContent.publisher;
  const publishedAt = mergedContent.publishedAt;
  const sourceUrl = mergedContent.sourceUrl;

  const handleOpenArticle = () => {
    if (!sourceUrl) return;
    window.open(sourceUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrev = () => nav(-1);

const handleNext = () => {
  nav("/nie/session/E/step/002", {
    state: {
      level: "E", // 🔹 이거 추가
      articleId: articleId ?? state?.articleId,
      articleUrl: sourceUrl ?? articleUrl ?? state?.articleUrl,
    },
  });
};


  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <h1 className={styles.heading}>기사 원문 읽기</h1>

        {/* 기사 카드 */}
        <button
          type="button"
          className={styles.articleCard}
          onClick={handleOpenArticle}
        >
          <div className={styles.thumbnailWrapper}>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="기사 썸네일"
                className={styles.thumbnail}
              />
            ) : (
              <div className={styles.thumbnailPlaceholder} />
            )}
          </div>

          <div className={styles.articleText}>
            <p className={styles.articleTitle}>{headline}</p>
            <p className={styles.articleMeta}>
              {publisher} · {publishedAt}
            </p>
          </div>
        </button>

        {/* 원문 이동 버튼 */}
        <div className={styles.primaryButtonWrapper}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleOpenArticle}
          >
            원문으로 이동하기
          </button>
        </div>

        {/* 하단 GNB */}
        <EduBottomBar onPrev={handlePrev} onNext={handleNext} />
      </div>
    </div>
  );
}

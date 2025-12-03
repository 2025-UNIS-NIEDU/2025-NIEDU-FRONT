// src/pages/ArticleDetail/ArticleDetail.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ArticleDetail.module.css";
import { useGoToPrepare } from "@/hooks/useGoToPrepare";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import {
  getCourseDetail,
  type MockSession,
} from "@/lib/mockCourseApi";

type CourseDetailData = {
  thumbnailUrl: string;
  title: string;
  topic: string | null;
  progress: number;
  longDescription: string;
};

type SessionData = MockSession;

const KEYWORDS = ["#미래", "#전환", "#협력"];

export default function ArticleDetail() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const goToPrepare = useGoToPrepare();

  const [detail, setDetail] = useState<CourseDetailData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ mock 데이터에서 상세 + 세션 가져오기
  useEffect(() => {
    if (!articleId) return;

    setLoadingDetail(true);
    setLoadingSessions(true);
    setErrorMsg(null);

    const idNum = Number(articleId);
    if (Number.isNaN(idNum)) {
      setErrorMsg("잘못된 코스 ID 입니다.");
      setDetail(null);
      setSessions([]);
      setLoadingDetail(false);
      setLoadingSessions(false);
      return;
    }

    const data = getCourseDetail(idNum);

    if (!data) {
      setDetail(null);
      setSessions([]);
      setLoadingDetail(false);
      setLoadingSessions(false);
      return;
    }

    setDetail({
      thumbnailUrl: data.thumbnailUrl,
      title: data.title,
      topic: data.topic,
      progress: data.progress,
      longDescription: data.longDescription,
    });
    setSessions(data.sessions);

    setLoadingDetail(false);
    setLoadingSessions(false);
  }, [articleId]);

  if (loadingDetail && !detail) {
    return <div className={styles.viewport}>로딩 중...</div>;
  }

  if (!detail) {
    return <div className={styles.viewport}>코스를 찾을 수 없습니다.</div>;
  }

  const progress = detail.progress ?? 0;

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

        {/* 🔥 HERO */}
        <div className={styles.hero}>
          <img
            src={detail.thumbnailUrl || "/sample-news.png"}
            alt=""
            className={styles.heroImg}
          />

          <button className={styles.backOnHero} onClick={() => navigate(-1)}>
            <img src="/icons/fluent_ios-arrow-24-filled.svg" alt="뒤로가기" />
          </button>

          <button className={styles.scrapBtn} type="button">
            <img src="/icons/STAR.svg" alt="스크랩" />
          </button>

          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{detail.title}</h1>

            {detail.topic && (
              <div className={styles.categoryChips}>
                <span className={styles.categoryChip}>{detail.topic}</span>
              </div>
            )}

            <div className={styles.keywordChips}>
              {KEYWORDS.map((k) => (
                <span key={k} className={styles.keywordChip}>
                  {k}
                </span>
              ))}
            </div>

            <p className={styles.heroDesc}>{detail.longDescription}</p>
          </div>
        </div>

        {/* 🔵 진행률 + 바로 학습하기 버튼 영역 */}
        <section className={styles.progressSection}>
          <p className={styles.progressText}>현재 진행률 {progress}%</p>
          <button
            type="button"
            className={styles.startButton}
            onClick={() => {
              const first = sessions[0];
              if (!articleId || !first) return;

              // useGoToPrepare 안에서 state.articleTitle 로 변환해줄 거라고 가정
              goToPrepare(articleId, {
                sessionId: first.sessionId,
                title: detail.title,
              });
            }}
          >
            바로 학습하기
          </button>
        </section>

        {/* 📚 학습 세션 리스트 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>학습 세션</h3>

          <div className={styles.sessionList}>
            {loadingSessions && sessions.length === 0 ? (
              <p className={styles.loading}>세션 불러오는 중...</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.sessionId}
                  type="button"
                  className={styles.sessionItem}
                  onClick={() =>
                    articleId &&
                    goToPrepare(articleId, {
                      sessionId: s.sessionId,
                      title: s.headline,
                    })
                  }
                >
                  <div className={styles.sessionThumb}>
                    {s.thumbnailUrl && (
                      <img
                        src={s.thumbnailUrl}
                        alt=""
                        className={styles.sessionThumbImg}
                      />
                    )}
                  </div>
                  <div className={styles.sessionText}>
                    <p className={styles.sessionName}>{s.headline}</p>
                    <p className={styles.sessionDesc}>
                      {s.publisher} · {s.publishedAt}
                    </p>
                  </div>
                  <img
                    src="/icons/icon-chevron-right.svg"
                    alt=""
                    className={styles.sessionArrow}
                  />
                </button>
              ))
            )}
          </div>
        </section>

        <div className={styles.bottomSpace} />
        <BottomNav activeTab="learn" />
      </div>
    </div>
  );
}

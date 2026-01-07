import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ArticleDetail.module.css";
import { useGoToPrepare } from "@/hooks/useGoToPrepare";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

type CourseDetailData = {
  thumbnailUrl: string;
  title: string;
  topic: string | null;
  progress: number;
  description: string;
};

type SessionData = {
  id: number;
  thumbnailUrl: string;
  headline: string;
  publisher: string;
  publishedAt: string; // "yyyy-MM-dd"
};

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

  useEffect(() => {
    if (!articleId) return;

    const courseId = Number(articleId);
    if (Number.isNaN(courseId)) {
      setErrorMsg("잘못된 코스 ID 입니다.");
      setDetail(null);
      setSessions([]);
      setLoadingDetail(false);
      setLoadingSessions(false);
      return;
    }

    const run = async () => {
      setErrorMsg(null);
      setLoadingDetail(true);
      setLoadingSessions(true);

      try {
        // ✅ 코스 상세 (주의: couses 오타 경로)
        const detailRes = await api.get<ApiResponse<any>>(
          `/api/edu/couses/${courseId}`
        );

        const d = detailRes.data.data;
        setDetail({
          thumbnailUrl: String(d?.thumbnailUrl ?? ""),
          title: String(d?.title ?? ""),
          topic: d?.topic ?? null,
          progress: Number(d?.progress ?? 0),
          description: String(d?.description ?? ""),
        });
      } catch (e) {
        console.error("[ArticleDetail] detail error:", e);
        setErrorMsg("코스 상세를 불러오지 못했어요.");
        setDetail(null);
      } finally {
        setLoadingDetail(false);
      }

      try {
        // ✅ 세션 리스트
        const sesRes = await api.get<ApiResponse<any[]>>(
          `/api/edu/courses/${courseId}/sessions`
        );
        const raw = Array.isArray(sesRes.data.data) ? sesRes.data.data : [];

        const mapped: SessionData[] = raw
          .map((x: any) => ({
            id: Number(x?.id ?? 0),
            thumbnailUrl: String(x?.thumbnailUrl ?? ""),
            headline: String(x?.headline ?? ""),
            publisher: String(x?.publisher ?? ""),
            publishedAt: String(x?.publishedAt ?? ""),
          }))
          .filter((x: SessionData) => x.id && x.headline);

        setSessions(mapped);
      } catch (e) {
        console.error("[ArticleDetail] sessions error:", e);
        setErrorMsg("세션 리스트를 불러오지 못했어요.");
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    };

    void run();
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

            <p className={styles.heroDesc}>{detail.description}</p>
          </div>
        </div>

        <section className={styles.progressSection}>
          <p className={styles.progressText}>현재 진행률 {progress}%</p>
          <button
            type="button"
            className={styles.startButton}
            onClick={() => {
              const first = sessions[0];
              if (!articleId || !first) return;

              goToPrepare(articleId, {
                sessionId: first.id,
                title: detail.title,
              });
            }}
            disabled={sessions.length === 0}
          >
            바로 학습하기
          </button>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>학습 세션</h3>

          <div className={styles.sessionList}>
            {loadingSessions && sessions.length === 0 ? (
              <p className={styles.loading}>세션 불러오는 중...</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={styles.sessionItem}
                  onClick={() =>
                    articleId &&
                    goToPrepare(articleId, {
                      sessionId: s.id,
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

// src/pages/ArticleDetail/ArticleDetail.tsx
import { useEffect, useMemo, useState } from "react";
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
  progress: number; // 0~100
  description: string;
  isSaved: boolean;
};

type SessionData = {
  id: number;
  thumbnailUrl: string;
  headline: string;
  publisher: string;
  publishedAt: string;
  sourceUrl?: string;
};

const KEYWORDS = ["#미래", "#전환", "#협력"];
const SAVED_DIRTY_KEY = "niedu_saved_courses_dirty";

function pickProgress(d: any): number {
  const candidates = [
    d?.progress,
    d?.progressRate,
    d?.progress_rate,
    d?.progressPercent,
    d?.progress_percent,
    d?.completionRate,
    d?.completion_rate,
    d?.completionPercent,
    d?.completion_percent,
    d?.courseProgress,
    d?.course_progress,
    d?.learningProgress,
    d?.learning_progress,
    d?.userProgress,
    d?.user_progress,
    d?.myProgress,
    d?.my_progress,
  ];

  const raw = candidates.find((v) => v !== undefined && v !== null);
  const n = Number(raw);

  if (!Number.isFinite(n)) return 0;

  const pct = n <= 1 && n > 0 ? Math.round(n * 100) : Math.round(n);
  return Math.max(0, Math.min(100, pct));
}

export default function ArticleDetail() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const goToPrepare = useGoToPrepare();

  const [detail, setDetail] = useState<CourseDetailData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const courseId = useMemo(() => {
    const n = Number(articleId);
    return Number.isFinite(n) ? n : NaN;
  }, [articleId]);

  const toggleSave = async (courseIdNum: number, nextSaved: boolean) => {
    setDetail((prev) => (prev ? { ...prev, isSaved: nextSaved } : prev));

    const candidates: Array<() => Promise<any>> = nextSaved
      ? [
          () => api.post(`/api/edu/courses/${courseIdNum}/save`),
          () => api.post(`/api/edu/courses/${courseIdNum}/saved`),
          () => api.post(`/api/edu/courses/${courseIdNum}/bookmark`),
          () => api.post(`/api/edu/courses/${courseIdNum}/like`),
        ]
      : [
          () => api.delete(`/api/edu/courses/${courseIdNum}/save`),
          () => api.delete(`/api/edu/courses/${courseIdNum}/saved`),
          () => api.delete(`/api/edu/courses/${courseIdNum}/bookmark`),
          () => api.delete(`/api/edu/courses/${courseIdNum}/like`),
        ];

    try {
      let ok = false;
      let lastErr: any = null;
      for (const call of candidates) {
        try {
          await call();
          ok = true;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!ok) throw lastErr;

      localStorage.setItem(SAVED_DIRTY_KEY, String(Date.now()));
    } catch (e) {
      console.error("[ArticleDetail] toggle save failed:", e);
      setDetail((prev) => (prev ? { ...prev, isSaved: !nextSaved } : prev));
    }
  };

  useEffect(() => {
    if (!articleId) return;

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
        const detailRes = await api.get<ApiResponse<any>>(`/api/edu/courses/${courseId}`);
        const d = detailRes.data?.data ?? {};

        setDetail({
          thumbnailUrl: String(d.thumbnailUrl ?? ""),
          title: String(d.title ?? ""),
          topic: d.topic ?? null,
          progress: pickProgress(d),
          description: String(d.description ?? ""),
          isSaved: Boolean(d?.isSaved ?? d?.saved ?? d?.bookmarked ?? d?.isBookmarked ?? false),
        });
      } catch (e) {
        console.error("[ArticleDetail] detail error:", e);
        setErrorMsg("코스 상세를 불러오지 못했어요.");
        setDetail(null);
      } finally {
        setLoadingDetail(false);
      }

      try {
        const sesRes = await api.get<ApiResponse<any[]>>(`/api/edu/courses/${courseId}/sessions`);
        const raw = Array.isArray(sesRes.data?.data) ? sesRes.data.data : [];

        const mapped: SessionData[] = raw
          .map((x: any) => {
            const sid = Number(x?.sessionId ?? x?.id ?? 0);
            return {
              id: sid,
              thumbnailUrl: String(x?.thumbnailUrl ?? ""),
              headline: String(x?.headline ?? x?.title ?? ""),
              publisher: String(x?.publisher ?? ""),
              publishedAt: String(x?.publishedAt ?? x?.date ?? ""),
              sourceUrl: x?.sourceUrl ? String(x.sourceUrl) : undefined,
            };
          })
          .filter((x: SessionData) => x.id > 0 && !!x.headline);

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
  }, [articleId, courseId]);

  if (loadingDetail && !detail) return <div className={styles.viewport}>로딩 중...</div>;
  if (!detail) return <div className={styles.viewport}>코스를 찾을 수 없습니다.</div>;

  const progress = detail.progress ?? 0;

  const goFirstSession = () => {
    const first = sessions[0];
    if (!articleId || !first) return;

    goToPrepare(articleId, {
      sessionId: first.id,
      title: detail.title,
      articleUrl: first.sourceUrl,
    });
  };

  const onClickScrap = async () => {
    if (saving) return;
    if (!Number.isFinite(courseId)) return;
    setSaving(true);
    try {
      await toggleSave(courseId, !detail.isSaved);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

        <div className={styles.hero}>
          <img src={detail.thumbnailUrl || "/sample-news.png"} alt="" className={styles.heroImg} />

          <button className={styles.backOnHero} onClick={() => navigate(-1)}>
            <img src="/icons/fluent_ios-arrow-24-filled.svg" alt="뒤로가기" />
          </button>

          <button
            className={styles.scrapBtn}
            type="button"
            aria-pressed={detail.isSaved}
            onClick={onClickScrap}
            disabled={saving}
          >
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
            onClick={goFirstSession}
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
                      articleUrl: s.sourceUrl,
                    })
                  }
                >
                  <div className={styles.sessionThumb}>
                    {s.thumbnailUrl && <img src={s.thumbnailUrl} alt="" className={styles.sessionThumbImg} />}
                  </div>

                  <div className={styles.sessionText}>
                    <p className={styles.sessionName}>{s.headline}</p>
                    <p className={styles.sessionDesc}>
                      {s.publisher} · {s.publishedAt}
                    </p>
                  </div>

                  <img src="/icons/icon-chevron-right.svg" alt="" className={styles.sessionArrow} />
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

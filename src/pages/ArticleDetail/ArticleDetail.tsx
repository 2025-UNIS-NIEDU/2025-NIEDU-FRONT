import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ArticleDetail.module.css";
import { useGoToPrepare } from "@/hooks/useGoToPrepare";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";

// 상세 조회 응답 타입
type CourseDetailData = {
  thumbnailUrl: string;
  title: string;
  topic: string;
  progress: number; // % 단위
  longDescription: string;
};

// 세션 리스트 응답 타입
type SessionData = {
  thumbnailUrl: string;
  headline: string;
  publisher: string;
  publishedAt: string; // LocalDate가 문자열로 올 것
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

  // ✅ 코스 상세 조회
  useEffect(() => {
    if (!articleId) return;

    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        setErrorMsg(null);

        // ⚠️ 백엔드 스펙이 /couses 라고 되어 있어서 그대로 사용
        const res = await fetch(`/api/edu/couses/${articleId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Cookie: accessToken 자동 포함
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          const err: any = new Error(
            json?.message || "코스 상세 조회 중 오류가 발생했어요."
          );
          err.status = json?.status ?? res.status;
          throw err;
        }

        setDetail(json.data as CourseDetailData);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message ?? "코스 상세 조회 중 오류가 발생했어요.");
        if (err.status === 401) {
          // 토큰 만료 시 로그인 등으로 보내기
          navigate("/login");
        }
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [articleId, navigate]);

  // ✅ 세션 리스트 조회
  useEffect(() => {
    if (!articleId) return;

    const fetchSessions = async () => {
      try {
        setLoadingSessions(true);
        setErrorMsg(null);

        const res = await fetch(`/api/edu/courses/${articleId}/sessions`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          const err: any = new Error(
            json?.message || "세션 리스트 조회 중 오류가 발생했어요."
          );
          err.status = json?.status ?? res.status;
          throw err;
        }

        setSessions(json.data as SessionData[]);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message ?? "세션 리스트 조회 중 오류가 발생했어요.");
        if (err.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [articleId, navigate]);

  // 아직 detail 못 받았을 때
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
        {/* 에러 메시지 공통 */}
        {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

        {/* 🔥 HERO (이미지 + 오버레이 + 뒤로가기 + 타이틀/키워드/설명) */}
        <div className={styles.hero}>
          <img
            src={detail.thumbnailUrl || "/sample-news.png"}
            alt=""
            className={styles.heroImg}
          />

          {/* 뒤로가기 버튼 (배경 없이 아이콘만) */}
          <button
            className={styles.backOnHero}
            onClick={() => navigate(-1)}
          >
            <img src="/icons/fluent_ios-arrow-24-filled.svg" alt="뒤로가기" />
          </button>

          {/* 즐겨찾기/스크랩 아이콘 */}
          <button className={styles.scrapBtn} type="button">
            <img src="/icons/STAR.svg" alt="스크랩" />
          </button>

          {/* 이미지 위 텍스트 영역 */}
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{detail.title}</h1>

            {/* topic 하나만 카테고리 칩으로 표시 */}
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

            <p className={styles.heroDesc}>
              {detail.longDescription}
            </p>
          </div>
        </div>

        {/* 🔵 진행률 + 바로 학습하기 버튼 영역 */}
        <section className={styles.progressSection}>
          <p className={styles.progressText}>현재 진행률 {progress}%</p>
          <button
            type="button"
            className={styles.startButton}
            onClick={() => articleId && goToPrepare(articleId)}
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
              sessions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.sessionItem}
                  onClick={() => articleId && goToPrepare(articleId)}
                >
                  <div className={styles.sessionThumb}>
                    {/* 썸네일 필요하면 이미지로 */}
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

        {/* 하단바와 겹치지 않게 여백 */}
        <div className={styles.bottomSpace} />

        {/* 👇 학습 탭이 활성화된 BottomNav */}
        <BottomNav activeTab="learn" />
      </div>
    </div>
  );
}

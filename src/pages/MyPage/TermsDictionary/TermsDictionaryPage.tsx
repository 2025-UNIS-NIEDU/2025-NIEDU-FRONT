// src/pages/MyPage/TermsDictionary/TermsDictionaryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import styles from "./TermsDictionaryPage.module.css";
import modalStyles from "@/pages/article/session/N/StepN002.module.css";

type TermItem = { termId: number; term: string };
type GroupAlphabetical = { initial: string; terms: TermItem[] };
type GroupRecent = { period: string; terms: TermItem[] };

type TermsListData = {
  groups: Array<GroupAlphabetical | GroupRecent>;
};

type TermDetail = {
  termId: number;
  name: string;
  definition: string;
  exampleSentence: string;
  additionalExplanation: string;
};

type Sort = "alphabetical" | "recent";

export default function TermsDictionaryPage() {
  const nav = useNavigate();

  const [sort, setSort] = useState<Sort>("alphabetical");
  const [sortOpen, setSortOpen] = useState(false);
  const [data, setData] = useState<TermsListData | null>(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TermDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiResponse<any>>(`/api/my/terms?sort=${sort}`);
        setData(res.data?.data ?? null);
      } catch (e) {
        console.error("[TermsDictionary] list error:", e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [sort]);

  const flatTerms = useMemo(() => {
    const groups = data?.groups ?? [];
    return groups.flatMap((g: any) => (Array.isArray(g.terms) ? g.terms : []));
  }, [data]);

  const openDetail = async (termId: number) => {
    setSelectedId(termId);
    setOpen(true);
    setLoadingDetail(true);
    setDetail(null);

    try {
      const res = await api.get<ApiResponse<TermDetail>>(`/api/my/terms/${termId}`);
      setDetail(res.data?.data ?? null);
    } catch (e) {
      console.error("[TermsDictionary] detail error:", e);
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const sortLabel = sort === "alphabetical" ? "가나다 순" : "최근 저장 순";

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <header className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => nav(-1)} aria-label="뒤로가기">
            <img src="/icons/fluent_ios-arrow-24-filled.svg" alt="" />
          </button>
          <h1 className={styles.title}>용어사전</h1>
          <div className={styles.rightDummy} />
        </header>

        <div className={styles.sortRow}>
          <button type="button" className={styles.sortSelect} onClick={() => setSortOpen((p) => !p)}>
            {sortLabel}
            <img
              src="/icons/ep_arrow-up-bold.svg"
              alt=""
              className={`${styles.chev} ${sortOpen ? styles.chevOpen : ""}`}
            />
          </button>

          {sortOpen && (
            <div className={styles.sortMenu}>
              <button
                type="button"
                className={styles.sortOption}
                onClick={() => {
                  setSort("alphabetical");
                  setSortOpen(false);
                }}
              >
                가나다 순
              </button>
              <button
                type="button"
                className={styles.sortOption}
                onClick={() => {
                  setSort("recent");
                  setSortOpen(false);
                }}
              >
                최근 저장 순
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className={styles.loading}>불러오는 중...</p>
        ) : !data || flatTerms.length === 0 ? (
          <p className={styles.empty}>용어가 없어요.</p>
        ) : (
          <div className={styles.groups}>
            {(data.groups as any[]).map((g, idx) => (
              <section key={idx} className={styles.group}>
                <div className={styles.groupTitle}>{"initial" in g ? g.initial : g.period}</div>

                <div className={styles.termGrid}>
                  {g.terms.map((t: TermItem) => (
                    <button key={t.termId} className={styles.termChip} onClick={() => openDetail(t.termId)}>
                      {t.term}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className={styles.bottomSpace} />
      </div>

      <BottomNav activeTab="mypage" />

      {/* ✅ N단계 팝업 구조/CSS 재사용 */}
      {open && (
        <div className={modalStyles.modalOverlay} onClick={() => setOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={modalStyles.modalStarBtn} aria-label="저장됨">
              <img src="/icons/Frame 1686564291 (1).svg" alt="" className={modalStyles.modalStarIcon} />
            </button>

            {loadingDetail ? (
              <p className={styles.loading}>불러오는 중...</p>
            ) : !detail ? (
              <p className={styles.empty}>상세를 불러오지 못했어요.</p>
            ) : (
              <>
                <h2 className={modalStyles.modalTitle}>{detail.name}</h2>
                <p className={modalStyles.modalDefinition}>{detail.definition}</p>

                <div className={modalStyles.modalBlock}>
                  <div className={modalStyles.modalBlockTitle}>예시 문장</div>
                  <p className={modalStyles.modalBlockBody}>{detail.exampleSentence}</p>
                </div>

                <div className={modalStyles.modalBlock}>
                  <div className={modalStyles.modalBlockTitle}>부가 설명</div>
                  <p className={modalStyles.modalBlockBody}>{detail.additionalExplanation}</p>
                </div>
              </>
            )}

            <button type="button" className={modalStyles.modalCloseBtn} onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

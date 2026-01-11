import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";
import styles from "./TermsDictionaryPage.module.css";

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
          <button
            className={`${styles.sortBtn} ${sort === "alphabetical" ? styles.sortActive : ""}`}
            onClick={() => setSort("alphabetical")}
          >
            가나다순
          </button>
          <button
            className={`${styles.sortBtn} ${sort === "recent" ? styles.sortActive : ""}`}
            onClick={() => setSort("recent")}
          >
            최근학습
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>불러오는 중...</p>
        ) : !data || flatTerms.length === 0 ? (
          <p className={styles.empty}>용어가 없어요.</p>
        ) : (
          <div className={styles.groups}>
            {(data.groups as any[]).map((g, idx) => (
              <section key={idx} className={styles.group}>
                <div className={styles.groupTitle}>
                  {"initial" in g ? g.initial : g.period}
                </div>

                <div className={styles.termGrid}>
                  {g.terms.map((t: TermItem) => (
                    <button
                      key={t.termId}
                      className={styles.termChip}
                      onClick={() => openDetail(t.termId)}
                    >
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

      {/* 오버레이 상세 (스샷 느낌) */}
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.starBtn} type="button" aria-label="즐겨찾기">
              <img src="/icons/STAR.svg" alt="" />
            </button>

            {loadingDetail ? (
              <p className={styles.loading}>불러오는 중...</p>
            ) : !detail ? (
              <p className={styles.empty}>상세를 불러오지 못했어요.</p>
            ) : (
              <>
                <h2 className={styles.termTitle}>{detail.name}</h2>
                <p className={styles.termDesc}>{detail.definition}</p>

                <div className={styles.block}>
                  <div className={styles.blockLabel}>예시 문장</div>
                  <div className={styles.blockText}>{detail.exampleSentence}</div>
                </div>

                <div className={styles.block}>
                  <div className={styles.blockLabel}>추가 설명</div>
                  <div className={styles.blockText}>{detail.additionalExplanation}</div>
                </div>
              </>
            )}
          </div>

          <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="닫기">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

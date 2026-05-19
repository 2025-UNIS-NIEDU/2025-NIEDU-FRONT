// src/pages/MyPage/Settings/SettingsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

import styles from "./SettingsPage.module.css";

type MeData = {
  nickname?: string;
  email?: string;
  profileImageUrl?: string;
};

function getLocalProfile() {
  const nickname = localStorage.getItem("niedu_profile_nickname") || "";
  const image = localStorage.getItem("niedu_profile_image") || "";
  return { nickname, image };
}

export default function SettingsPage() {
  const nav = useNavigate();
  const location = useLocation();

  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiResponse<MeData>>("/api/user/me");
        setMe(res.data?.data ?? null);
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const profile = useMemo(() => {
    const local = getLocalProfile();
    const nickname = local.nickname || me?.nickname || "사용자";
    const email = me?.email || (me as any)?.kakaoEmail || (me as any)?.accountEmail || "";
    const imageUrl = local.image || me?.profileImageUrl || "";
    return { nickname, email, imageUrl };
  }, [me]);

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} type="button" onClick={() => nav(-1)}>
            <img src="/icons/fluent_ios-arrow.svg" alt="뒤로" />
          </button>
          <h1 className={styles.title}>설정</h1>
        </div>

        <div className={styles.profileBlock}>
          <div className={styles.profileText}>
            <div className={styles.profileName}>
              {loading ? "불러오는 중..." : `${profile.nickname} 님`}
            </div>
            {profile.email ? <div className={styles.profileEmail}>{profile.email}</div> : null}
          </div>
        </div>

        <div className={styles.sectionLabel}>나의 계정</div>
        <button className={styles.rowBtn} type="button" onClick={() => nav("/mypage/settings/edit")}>
          <div className={styles.rowTitle}>정보 수정</div>
        </button>
        <button className={styles.rowBtn} type="button" onClick={() => setLogoutOpen(true)}>
          <div className={styles.rowTitle}>로그아웃</div>
        </button>

        <div className={styles.sectionLabel}>서비스</div>
        <button className={styles.rowBtn} type="button" onClick={() => nav("/mypage/settings/topics")}>
          <div className={styles.rowTitle}>선호 토픽 설정</div>
        </button>

        {/* ✅ Push는 “모달 라우트”로 열어서 Settings가 뒤에 보이게 */}
        <button
          className={styles.rowBtn}
          type="button"
          onClick={() =>
            nav("/mypage/settings/push", {
              state: { backgroundLocation: location },
            })
          }
        >
          <div className={styles.rowTitle}>푸시 알림 설정</div>
        </button>

        <div className={styles.sectionLabel}>약관</div>
        <button className={styles.rowBtn} type="button" onClick={() => nav("/mypage/settings/terms")}>
          <div className={styles.rowTitle}>이용약관</div>
        </button>
        <button className={styles.rowBtn} type="button" onClick={() => nav("/mypage/settings/privacy")}>
          <div className={styles.rowTitle}>개인정보처리방침</div>
        </button>

        <div className={styles.sectionLabel}>회원 탈퇴</div>
        <button className={styles.rowBtn} type="button" onClick={() => setWithdrawOpen(true)}>
          <div className={styles.rowTitle}>회원 탈퇴 신청</div>
        </button>

        {logoutOpen && (
          <div className={styles.dim} role="presentation" onClick={() => setLogoutOpen(false)}>
            <div className={styles.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalTitle}>로그아웃 하시겠어요?</div>
              <div className={styles.modalBtns}>
                <button className={styles.modalBtnGray} type="button" onClick={() => setLogoutOpen(false)}>
                  취소
                </button>
                <button className={styles.modalBtnBlue} type="button" onClick={() => setLogoutOpen(false)}>
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}

        {withdrawOpen && (
          <div className={styles.dim} role="presentation" onClick={() => setWithdrawOpen(false)}>
            <div className={styles.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalTitle}>탈퇴하시겠어요?</div>
              <div className={styles.modalDesc}>
                탈퇴 후 7일 이내에는 언제든 계정을 복구할 수 있습니다.
                <br />
                7일이 지나면 계정과 모든 데이터가 영구적으로 삭제됩니다.
              </div>
              <div className={styles.modalBtns}>
                <button className={styles.modalBtnGray} type="button" onClick={() => setWithdrawOpen(false)}>
                  취소
                </button>
                <button className={styles.modalBtnBlue} type="button" onClick={() => setWithdrawOpen(false)}>
                  탈퇴하기
                </button>
              </div>
            </div>
          </div>
        )}

        <BottomNav activeTab="mypage" />
      </div>
    </div>
  );
}

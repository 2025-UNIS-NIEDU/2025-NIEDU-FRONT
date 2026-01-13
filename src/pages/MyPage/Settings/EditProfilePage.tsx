// src/pages/MyPage/Settings/EditProfilePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import api from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/api";

import styles from "./EditProfilePage.module.css";

type MeData = {
  nickname?: string;
  profileImageUrl?: string;
};

const LS_NICKNAME = "niedu_profile_nickname";
const LS_IMAGE = "niedu_profile_image";

export default function EditProfilePage() {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [serverMe, setServerMe] = useState<MeData | null>(null);
  const [nickname, setNickname] = useState("");
  const [preview, setPreview] = useState("");
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get<ApiResponse<MeData>>("/api/user/me");
        const me = res.data?.data ?? null;
        setServerMe(me);
      } catch {
        setServerMe(null);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    const localNickname = localStorage.getItem(LS_NICKNAME) || "";
    const localImage = localStorage.getItem(LS_IMAGE) || "";
    if (localNickname) setNickname(localNickname);
    if (localImage) setPreview(localImage);
  }, []);

  const baseNickname = useMemo(() => nickname || serverMe?.nickname || "사용자", [nickname, serverMe]);
  const baseImage = useMemo(() => preview || serverMe?.profileImageUrl || "", [preview, serverMe]);

  const openFile = () => fileRef.current?.click();

  const onFileChange = async (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      setPreview(url);
    };
    reader.readAsDataURL(f);
  };

  const save = () => {
    localStorage.setItem(LS_NICKNAME, baseNickname);
    if (baseImage) localStorage.setItem(LS_IMAGE, baseImage);
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 1600);
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} type="button" onClick={() => nav(-1)}>
            <img src="/icons/icon-back.svg" alt="뒤로" />
          </button>
          <h1 className={styles.title}>정보 수정</h1>
        </div>

        <div className={styles.profileWrap}>
          <button className={styles.avatarBtn} type="button" onClick={openFile}>
            <div className={styles.avatarCircle}>
              {baseImage ? <img src={baseImage} alt="프로필" className={styles.avatarImg} /> : null}
            </div>
            <img src="/icons/icon-photo.svg" alt="사진 변경" className={styles.photoIcon} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className={styles.nickBox}>
          <div className={styles.nickLabel}>닉네임</div>
          <div className={styles.nickRow}>
            <input
              className={styles.nickInput}
              value={baseNickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임"
            />
            <button
              className={styles.penBtn}
              type="button"
              onClick={() => document.querySelector<HTMLInputElement>(`.${styles.nickInput}`)?.focus()}
            >
              <img src="/icons/icon-pen.svg" alt="수정" />
            </button>
          </div>
        </div>

        <button className={styles.saveBtn} type="button" onClick={save}>
          저장하기
        </button>

        {savedToast && (
          <div className={styles.toast}>
            <img src="/icons/icon-user.svg" alt="" className={styles.toastIcon} />
            <span>프로필 정보가 변경되었습니다</span>
          </div>
        )}

        <BottomNav activeTab="mypage" />
      </div>
    </div>
  );
}

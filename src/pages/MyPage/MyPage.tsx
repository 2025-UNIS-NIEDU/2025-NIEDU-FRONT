import { useState } from "react";
import type { ChangeEvent } from "react";
import BottomNav from "../onboarding/components/BottomNav/BottomNav";
import styles from "./MyPage.module.css";

export default function MyPage() {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth(); // 0~11
  const todayDate = today.getDate();

  // 프로필 이미지 (업로드한 사진 미리보기)
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // 캘린더에 표시할 연/월 상태
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth); // 0 = 1월

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);
  for (let d = 1; d <= lastDate; d++) daysArray.push(d);

  const handlePrevMonth = () => {
    setMonth((prev) => {
      if (prev === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setMonth((prev) => {
      if (prev === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // 프로필 사진 업로드 핸들러
  const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        {/* 상단 타이틀 + 설정 버튼 */}
        <div className={styles.topBar}>
          <h1 className={styles.title}>마이페이지</h1>
          <button type="button" className={styles.settingsButton}>
            <img
              src="/icons/icon-settings.svg"
              alt=""
              className={styles.settingsIcon}
            />
            <span>설정</span>
          </button>
        </div>

        {/* 프로필 영역 */}
        <div className={styles.profileBox}>
          <div className={styles.profileImageWrapper}>
            {/* 기본 배경 프레임 (Ellipse 25) */}
            <img
              src="/icons/Ellipse 25.svg"
              alt="프로필 프레임"
              className={styles.profileFrame}
            />

            {/* 업로드한 사진이 있으면 표시 */}
            {profileImage && (
              <img
                src={profileImage}
                alt="프로필"
                className={styles.profilePhoto}
              />
            )}

            {/* 사진 추가 버튼 (라벨 + 숨겨진 input) */}
            <label className={styles.profileUploadButton}>
              +
              <input
                type="file"
                accept="image/*"
                className={styles.profileUploadInput}
                onChange={handleProfileChange}
              />
            </label>
          </div>

          <div>
            <p className={styles.name}>이화연 님</p>
            <p className={styles.streak}>2일 연속 출석하셨어요!</p>
          </div>
        </div>

        {/* 용어 사전 섹션 타이틀 */}
        <div className={styles.sectionTitle}>
          <img
            src="/icons/majesticons_book.svg"
            alt="1"
            className={styles.sectionIcon}
          />
          <span>용어 사전</span>
        </div>

        {/* 달력 전체 박스 */}
        <div className={styles.calendarBox}>
          <div className={styles.monthHeader}>
            <button
              className={styles.monthArrow}
              type="button"
              onClick={handlePrevMonth}
            >
              <img
                src="/icons/Polygon 4.svg"
                alt="이전 달"
                className={`${styles.monthArrowIcon} ${styles.monthArrowLeft}`}
              />
            </button>
            <span className={styles.monthLabel}>
              {year}년 {month + 1}월
            </span>
            <button
              className={styles.monthArrow}
              type="button"
              onClick={handleNextMonth}
            >
              <img
                src="/icons/Polygon 4.svg"
                alt="다음 달"
                className={styles.monthArrowIcon}
              />
            </button>
          </div>

          <div className={styles.grid}>
            {daysArray.map((day, idx) => {
              if (day === null)
                return <div key={idx} className={styles.emptyCell} />;

              const isToday =
                day === todayDate &&
                month === todayMonth &&
                year === todayYear;

              return (
                <div key={idx} className={styles.dayCell}>
                  <div
                    className={`${styles.dayNumber} ${
                      isToday ? styles.today : ""
                    }`}
                  >
                    {day}
                  </div>
               {isToday && (
  <div className={styles.tag}>
    <span className={styles.tagStrong}>경제</span>
    <span className={styles.tagWeak}>#코인</span>
  </div>
)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단바 */}
      <BottomNav activeTab="mypage" />
    </div>
  );
}

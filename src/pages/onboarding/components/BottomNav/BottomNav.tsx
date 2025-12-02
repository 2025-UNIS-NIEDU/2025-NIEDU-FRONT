import { NavLink, useLocation } from "react-router-dom";
import styles from "./BottomNav.module.css";

type TabKey = "home" | "learn" | "mypage";

interface BottomNavProps {
  /** 경로 대신 강제로 활성화할 탭 (예: ArticleDetail, ArticlePrepare에서 'learn') */
  activeTab?: TabKey;
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const { pathname } = useLocation();

  // 프롭이 있으면 그것을 우선 사용, 없으면 기존 경로 기반 판별
  const isHome =
    activeTab === "home" ||
    (!activeTab &&
      (pathname === "/" ||
        pathname === "/home" ||
        pathname.startsWith("/recent-courses") ||
        pathname.startsWith("/saved-courses")));

  const isLearn =
    activeTab === "learn" ||
    (!activeTab &&
      (pathname.startsWith("/learn") ||
        pathname.startsWith("/article"))); // 👈 기사/학습 준비 화면도 learn으로 취급

  const isMypage =
    activeTab === "mypage" ||
    (!activeTab && pathname.startsWith("/mypage"));

  return (
    <nav className={styles.nav} aria-label="하단 내비게이션">
      <div className={styles.bar}>
        {/* 홈 */}
        <NavLink to="/home" className={isHome ? styles.active : styles.inactive}>
          <img
            src={
              isHome
                ? "/icons/icon-tab-home-active.svg"
                : "/icons/icon-tab-home.svg"
            }
            alt="홈"
            className={styles.icon}
          />
        </NavLink>

        {/* 학습 */}
        <NavLink
          to="/learn"
          className={isLearn ? styles.active : styles.inactive}
        >
          <img
            src={
              isLearn
                ? "/icons/icon-tab-course-active.svg"
                : "/icons/icon-tab-course.svg"
            }
            alt="학습"
            className={styles.icon}
          />
        </NavLink>

        {/* 마이페이지 */}
        <NavLink
          to="/mypage"
          className={isMypage ? styles.active : styles.inactive}
        >
          <img
            src={
              isMypage
                ? "/icons/icon-tab-mypage-active.svg"
                : "/icons/icon-tab-mypage.svg"
            }
            alt="마이페이지"
            className={styles.icon}
          />
        </NavLink>
      </div>
    </nav>
  );
}

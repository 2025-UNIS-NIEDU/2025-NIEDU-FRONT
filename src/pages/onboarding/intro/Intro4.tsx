import { useNavigate } from "react-router-dom";
import base from "./IntroBase.module.css";
import styles from "./Intro4.module.css";
import IntroHeader from "../components/IntroHeader";

export default function Intro4() {
  const nav = useNavigate();

  return (
    <div className={base.viewport}>
      <div className={base.container}>
        <IntroHeader
          total={7}
          active={4}
          theme="light"
          onSkip={() => nav("/onboarding/intro/7")}
        />

        <div className={base.content}>
          {/* ✅ 사진+글 중앙 정렬 */}
          <div className={styles.center}>
            <img className={styles.ill} src="/icons/intro4img.png" alt="service" />

            <div className={styles.textArea}>
              <p className={styles.p}>요약 퀴즈·용어 카드로 가볍게 배우고,</p>
            </div>
          </div>

          <button
            className={`${base.bottomBtn} ${base.grayBtn}`}
            onClick={() => nav("/onboarding/intro/5")}
          >
            다음으로
          </button>
        </div>
      </div>
    </div>
  );
}

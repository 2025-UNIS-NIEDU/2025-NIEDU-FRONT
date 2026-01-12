import { useNavigate } from "react-router-dom";
import base from "./IntroBase.module.css";
import styles from "./Intro5.module.css";
import IntroHeader from "../components/IntroHeader";

export default function Intro5() {
  const nav = useNavigate();

  return (
    <div className={base.viewport}>
      <div className={base.container}>
        <IntroHeader
          total={7}
          active={5}
          theme="light"
          onSkip={() => nav("/onboarding/intro/7")}
        />

        <div className={base.content}>
          {/* ✅ 이미지 + 텍스트 중앙 정렬 */}
          <div className={styles.center}>
            <img
              className={styles.ill}
              src="/icons/intro5img.png"
              alt="calendar"
            />

            <div className={styles.textArea}>
              <p className={styles.p}>
                캘린더와 리포트로 <b>습관</b>을 만들며
              </p>
            </div>
          </div>

          <button
            className={`${base.bottomBtn} ${base.grayBtn}`}
            onClick={() => nav("/onboarding/intro/6")}
          >
            다음으로
          </button>
        </div>
      </div>
    </div>
  );
}

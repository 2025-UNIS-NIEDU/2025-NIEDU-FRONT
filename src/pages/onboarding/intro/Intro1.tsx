import { useNavigate } from "react-router-dom";
import base from "./IntroBase.module.css";
import styles from "./Intro1.module.css";
import IntroHeader from "../components/IntroHeader";

export default function Intro1() {
  const nav = useNavigate();

  return (
    <div className={base.viewport}>
      <div className={`${base.container} ${styles.bgBlue}`}>
        <IntroHeader total={7} active={1} onSkip={() => nav("/onboarding/intro/7")} />

        <div className={base.content}>
          <div className={styles.center}>
            {/* 로고 이미지가 없으면 텍스트로 대체 */}
            <div className={styles.logoBox}>N</div>

            <div className={styles.titleArea}>
              <div className={styles.title1}>뉴스와 학습을 연결하다</div>
              <div className={styles.title2}>NIEdu</div>
            </div>
          </div>

          <button
            className={`${base.bottomBtn} ${base.grayBtnStrong}`}
            onClick={() => nav("/onboarding/intro/2")}
          >
            다음으로
          </button>
        </div>
      </div>
    </div>
  );
}

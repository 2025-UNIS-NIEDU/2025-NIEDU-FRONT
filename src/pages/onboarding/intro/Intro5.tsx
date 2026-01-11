import { useNavigate } from "react-router-dom";
import base from "./IntroBase.module.css";
import styles from "./Intro5.module.css";
import IntroHeader from "../components/IntroHeader";

export default function Intro5() {
  const nav = useNavigate();

  return (
    <div className={base.viewport}>
      <div className={base.container}>
        <IntroHeader total={7} active={5} onSkip={() => nav("/onboarding/intro/7")} />

        <div className={base.content}>
          <div className={styles.illWrap}>
            <img className={styles.ill} src="/onboarding/service2.png" alt="calendar" />
          </div>

          <div className={styles.textArea}>
            <p className={styles.p}>
              캘린더와 리포트로 <b>습관</b>을 만들며
            </p>
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

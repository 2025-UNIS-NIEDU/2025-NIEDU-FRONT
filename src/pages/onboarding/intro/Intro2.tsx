import { useNavigate } from "react-router-dom";
import base from "./IntroBase.module.css";
import styles from "./Intro2.module.css";
import IntroHeader from "../components/IntroHeader";

export default function Intro2() {
  const nav = useNavigate();

  return (
    <div className={base.viewport}>
      <div className={base.container}>
        <IntroHeader total={7} active={2} onSkip={() => nav("/onboarding/intro/7")} />

        <div className={base.content}>
          <div className={styles.illWrap}>
            <img className={styles.ill} src="/onboarding/bunny.png" alt="bunny" />
          </div>

          <div className={styles.textArea}>
            <h2>뉴스, 어렵게만 느껴지셨나요?</h2>
          </div>

          <button
            className={`${base.bottomBtn} ${base.grayBtn}`}
            onClick={() => nav("/onboarding/intro/3")}
          >
            다음으로
          </button>
        </div>
      </div>
    </div>
  );
}

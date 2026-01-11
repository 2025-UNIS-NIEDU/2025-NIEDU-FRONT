import { useNavigate } from "react-router-dom";
import base from "./IntroBase.module.css";
import styles from "./Intro6.module.css";
import IntroHeader from "../components/IntroHeader";

export default function Intro6() {
  const nav = useNavigate();

  return (
    <div className={base.viewport}>
      <div className={base.container}>
        <IntroHeader total={7} active={6} onSkip={() => nav("/onboarding/intro/7")} />

        <div className={base.content}>
          <div className={styles.illWrap}>
            <img className={styles.ill} src="/onboarding/service3.png" alt="community" />
          </div>

          <div className={styles.textArea}>
            <p className={styles.p}>다른 사람들과 의견도 나눌 수 있어요.</p>
          </div>

          <button
            className={`${base.bottomBtn} ${base.grayBtn}`}
            onClick={() => nav("/onboarding/intro/7")}
          >
            다음으로
          </button>
        </div>
      </div>
    </div>
  );
}

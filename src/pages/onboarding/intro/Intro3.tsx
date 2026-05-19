import { useNavigate } from "react-router-dom";
import base from "./IntroBase.module.css";
import styles from "./Intro3.module.css";
import IntroHeader from "../components/IntroHeader";

export default function Intro3() {
  const nav = useNavigate();

  return (
    <div className={base.viewport}>
      <div className={base.container}>
        <IntroHeader
          total={7}
          active={3}
          theme="light"
          onSkip={() => nav("/onboarding/intro/7")}
        />

        <div className={base.content}>
          {/* ✅ 사진+글 중앙 정렬 */}
          <div className={styles.center}>
            <img
              className={styles.ill}
              src="/icons/bunnywithlogo.png"
              alt="bunny"
            />

            <div className={styles.textArea}>
              <p className={styles.p}>
                NIEdu는 <b>뉴스를 쉽게 풀어</b>
                <br />
                문해력과 시사상식을 쌓을 수 있도록
                <br />
                도와주는 학습 서비스예요.
              </p>
            </div>
          </div>

          <button
            className={`${base.bottomBtn} ${base.grayBtn}`}
            onClick={() => nav("/onboarding/intro/4")}
          >
            다음으로
          </button>
        </div>
      </div>
    </div>
  );
}

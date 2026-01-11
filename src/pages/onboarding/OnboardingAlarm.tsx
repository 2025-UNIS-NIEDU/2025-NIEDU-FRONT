import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ✅ 공통 레이아웃(430px 컨테이너, viewport 등)
import base from "@/pages/onboarding/intro/IntroBase.module.css";

// ✅ 알람 전용 CSS
import s from "./OnboardingAlarm.module.css";

export default function OnboardingAlarm() {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: { topics?: string[] } };

  const [amEnabled, setAmEnabled] = useState(true);
  const [pmEnabled, setPmEnabled] = useState(true);
  const anyEnabled = useMemo(() => amEnabled || pmEnabled, [amEnabled, pmEnabled]);
  const [info, setInfo] = useState("");

  const requestPermission = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setInfo("알림 권한이 허용되었어요");
        // TODO: 여기서 실제 푸시 구독/서버 등록 로직 연결
      } else if (perm === "denied") {
        setInfo("알림 권한이 거부되었어요. 설정에서 변경할 수 있어요.");
      } else {
        setInfo("알림 권한 요청이 보류되었어요.");
      }
    } catch {
      setInfo("이 브라우저에서는 알림을 사용할 수 없어요.");
    }
  };

  const handleStart = async () => {
    // 토글 켠 게 있으면 권한 요청(사용자 제스처 내부)
    if (anyEnabled && "Notification" in window) {
      await requestPermission();
    }
    nav("/home", { state: { topics: state?.topics ?? [], amEnabled, pmEnabled } });
  };

  return (
    <div className={base.viewport}>
      <div className={base.container}>
        <header className={s.header}>
          <h1 className={s.title}>
            매일 뉴스를 학습하시도록
            <br />
            기본 알람 설정을 해드릴게요.
          </h1>
          <p className={s.sub}>알람은 나중에 설정에서 바꿀 수 있어요.</p>
        </header>

        <div className={s.cardList}>
          <div className={`${s.card} ${amEnabled ? s.on : s.off}`}>
            <span className={s.cardLabel}>AM 08:00</span>
            <button
              type="button"
              className={`${s.switch} ${amEnabled ? s.switchOn : s.switchOff}`}
              aria-pressed={amEnabled}
              onClick={() => setAmEnabled((v) => !v)}
              title="AM 08:00 알람 스위치"
            >
              <span className={s.knob} />
            </button>
          </div>

          <div className={`${s.card} ${pmEnabled ? s.on : s.off}`}>
            <span className={s.cardLabel}>PM 10:00</span>
            <button
              type="button"
              className={`${s.switch} ${pmEnabled ? s.switchOn : s.switchOff}`}
              aria-pressed={pmEnabled}
              onClick={() => setPmEnabled((v) => !v)}
              title="PM 10:00 알람 스위치"
            >
              <span className={s.knob} />
            </button>
          </div>
        </div>

        <div className={s.noticeBox}>
          <span className={s.noticeIcon} aria-hidden>
            🔔
          </span>
          <span className={s.noticeText}>{info || "알림은 나중에 설정에서 바꿀 수 있어요"}</span>
        </div>

        {/* ✅ 컨테이너 내부 하단 고정(IntroBase 방식) */}
        <button className={s.nextButtonStart} onClick={handleStart}>
          NIEdu 시작하기
        </button>
      </div>
    </div>
  );
}

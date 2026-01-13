// src/pages/MyPage/Settings/PrivacyPage.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./PolicyPage.module.css";

export default function PrivacyPage() {
  const nav = useNavigate();

  const text = useMemo(
    () => `[NIEdu] 개인정보처리방침

1. 개인정보의 수집 및 이용 목적 
NIEdu는 이용자에게 맞춤형 뉴스 콘텐츠와 AI 기반 퀴즈 서비스를 제공하기 위해 소중한 개인정보를 수집합니다. 이용자가 카카오 계정 연동을 통해 회원가입을 진행할 때, 카카오로부터 제공받는 식별자(UID), 닉네임, 프로필 사진 정보를 수집하여 본인 확인 및 서비스 로그인을 위해 활용합니다. 또한, 이용자가 앱 내에서 뉴스를 읽거나 퀴즈를 푸는 과정에서 발생하는 이용 기록과 답변 정보는 서비스 품질 개선 및 개인화된 콘텐츠 추천을 위해 사용됩니다.

2. AI 학습 활용에 관한 고지 
NIEdu는 인공지능 기술을 활용하여 퀴즈 문제를 생성하고 유저의 답변을 분석합니다. 이 과정에서 이용자가 입력한 퀴즈 답변 데이터는 AI 모델의 성능을 고도화하고 학습시키는 용도로 활용될 수 있습니다. NIEdu는 학습 데이터 활용 시 개인을 직접적으로 식별할 수 있는 정보를 제거하는 비식별화 처리를 거쳐 안전하게 관리하며, 오직 서비스의 지능화 및 기술 발전을 위해서만 사용합니다.

3. 정보의 공유 및 공개 
NIEdu는 유저 간 지식 공유를 목적으로 하며, 이용자가 작성한 퀴즈 답변은 서비스 내 공유 기능을 통해 다른 유저들에게 공개될 수 있습니다. 이때 이용자의 닉네임과 답변 내용이 함께 노출될 수 있으므로, 답변 작성 시 개인정보가 포함되지 않도록 유의해 주시기 바랍니다. 만약 본인의 답변이 공개되는 것을 원치 않으실 경우, 설정 메뉴를 통해 공유 범위를 제한하거나 회원 탈퇴를 통해 정보를 삭제할 수 있습니다.

4. 개인정보의 보유 및 파기 
NIEdu는 원칙적으로 이용자가 서비스를 탈퇴하거나 수집 목적이 달성된 경우 개인정보를 지체 없이 파기합니다. 다만, 관계 법령에 따라 보존할 필요가 있는 경우나 서비스 부정 이용 방지를 위한 내부 방침에 따라 일정 기간 보관할 수 있습니다. AI 학습에 활용된 데이터는 특정 개인을 알아볼 수 없는 통계적 형태로 변환되어 NIEdu의 서비스 운영 종료 시까지 보관될 수 있습니다.

5. 이용자의 권리와 의무 
이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 서비스 탈퇴를 통해 개인정보 이용 동의를 철회할 수 있습니다. 이용자는 자신의 정보를 최신으로 유지해야 하며, 타인의 개인정보를 도용하여 답변을 작성하거나 공유하여 발생하는 문제에 대한 책임은 이용자 본인에게 있습니다.`,
    []
  );

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} type="button" onClick={() => nav(-1)}>
            <img src="/icons/fluent_ios-arrow.svg" alt="뒤로" />
          </button>
          <h1 className={styles.title}>개인정보처리방침</h1>
        </div>

        <div className={styles.card}>
          <pre className={styles.pre}>{text}</pre>
        </div>

        <BottomNav activeTab="mypage" />
      </div>
    </div>
  );
}

// src/pages/MyPage/Settings/TermsPage.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "@/pages/onboarding/components/BottomNav/BottomNav";
import styles from "./PolicyPage.module.css";

export default function TermsPage() {
  const nav = useNavigate();

  const text = useMemo(
    () => `[NIEdu] 서비스 이용약관

제1장 총칙
제1조 (목적): 본 약관은 [회사명] (이하 '회사')이 제공하는 [서비스명] 및 관련 서비스(이하 '서비스')의 이용 조건 및 절차에 관한 기본적인 사항을 정함을 목적으로 합니다.
제2조 (용어의 정의): 본 약관에서 사용하는 주요 용어(회원, 아이디, 유료 서비스, 콘텐츠 등)의 정의를 명시합니다.
제3조 (약관의 효력 및 변경): 회원이 약관에 동의하고 서비스 이용을 신청함으로써 효력이 발생하며, 회사가 약관을 변경할 경우 그 절차와 고지 의무를 명시합니다.

제2장 서비스 이용 계약
제4조 (이용 계약의 성립): 서비스 이용 신청 절차 및 회사의 승낙 여부를 명시합니다.
제5조 (회원의 의무): 회원의 아이디 및 비밀번호 관리 의무, 개인 정보 제공 의무, 법령 및 약관 준수 의무 등을 명시합니다.
제6조 (개인정보보호 의무): 회사가 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호할 의무를 명시합니다.

제3장 서비스의 이용 및 제한
제7조 (서비스의 제공): 회사가 회원에게 제공하는 서비스의 종류 및 내용(뉴스 콘텐츠, 퀴즈, AI 피드백 등)을 명시합니다.
제8조 (유료 서비스의 이용): 유료 서비스(프리미엄 구독 등)의 종류, 결제 방식, 이용 기간 등을 명시합니다.
제9조 (정보의 제공 및 광고 게재): 서비스 이용 중 필요한 정보나 광고를 회원에게 제공할 수 있음을 명시합니다.
제10조 (게시물의 관리 및 저작권): 회원이 서비스 내에 게시한 게시물의 저작권, 회사의 게시물 관리 및 삭제 권한을 명시합니다.

제4장 유료 서비스 환불 및 청약 철회
제11조 (청약 철회 및 환불 규정): 유료 서비스 결제 후 일정 기간 이내의 청약 철회 가능 여부, 환불 기준 및 절차 등을 상세히 명시합니다.
제12조 (이용 제한 및 계약 해지): 회사의 서비스 이용 제한 사유(불법 행위, 약관 위반 등), 이용 제한에 따른 이의 제기 절차, 회원의 계약 해지 절차를 명시합니다.

제5장 손해배상 및 기타
제13조 (손해배상): 회사가 서비스 이용과 관련하여 회원에게 발생한 손해에 대한 배상 책임 및 면책 조항을 명시합니다.
제14조 (면책 조항): 천재지변, 통신 장애 등 회사의 귀책 사유가 아닌 경우의 책임 한계를 명시합니다.
제15조 (재판권 및 준거법): 약관 해석 및 회원과 회사 간 분쟁 발생 시 관할 법원 및 적용될 법률을 명시합니다.`,
    []
  );

  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} type="button" onClick={() => nav(-1)}>
            <img src="/icons/icon-back.svg" alt="뒤로" />
          </button>
          <h1 className={styles.title}>이용약관</h1>
        </div>

        <div className={styles.card}>
          <pre className={styles.pre}>{text}</pre>
        </div>

        <BottomNav activeTab="mypage" />
      </div>
    </div>
  );
}

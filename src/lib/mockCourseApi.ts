// src/lib/mockCourseApi.ts

// JSON 더미 데이터 import
import economyPackage from "@/data/economy_2025-11-24_package.json";

// JSON 구조 타입 유추
type RawPackage = typeof economyPackage;
type RawCourseBase = RawPackage["courses"][number];
type RawSession = RawCourseBase["sessions"][number];

// 🔹 실제 JSON에는 thumbnailUrl 이 course 레벨에 없을 수도 있으니까 optional 로 확장
type RawCourse = RawCourseBase & {
  thumbnailUrl?: string;
};

export type MockCourse = {
  id: number;          // 프론트에서 쓰는 id
  courseId: number;    // 백엔드 courseId랑 맞춰서 쓰고 싶으면 이걸 사용
  thumbnailUrl: string;
  title: string;
  description: string;
  topic: string | null;
  subTopic: string | null;
};

// 세션 프리뷰 타입 (ArticleDetail에서 사용)
export type MockSession = {
  sessionId: number;
  thumbnailUrl: string;
  headline: string;
  publisher: string;
  publishedAt: string;
};

// JSON → 프론트용 코스 형태로 1번만 변환
const RAW_COURSES: RawCourse[] = (economyPackage.courses ?? []) as RawCourse[];

const ALL_COURSES: MockCourse[] = RAW_COURSES.map((c, idx) => {
  const firstSessionThumb = c.sessions?.[0]?.thumbnailUrl ?? "";

  return {
    id: c.courseId ?? idx + 1,
    courseId: c.courseId ?? idx + 1,
    thumbnailUrl: c.thumbnailUrl ?? firstSessionThumb, // ✅ 없으면 세션 썸네일로 대체
    title: c.courseName,
    description: c.courseDescription,
    topic: c.topic ?? null,
    subTopic: c.subTopic ?? null,
  };
});

// Learn.tsx / Home.tsx 에서 넘겨주는 파라미터 타입
export type GetCoursesParams = {
  type?: "recent" | "popular" | "custom" | "new";
  view?: "preview" | "detail";
  topic?: string; // "politics" | "economy" | ...
  page?: number;
};

// 한글 topic 과 서버 topic 매핑 (필터용)
const TOPIC_MAP: Record<string, string> = {
  politics: "정치",
  economy: "경제",
  society: "사회",
  world: "세계",
};

/**
 * 코스 리스트 더미 반환
 * - 지금은 type / view / page 는 크게 안 쓰고
 * - topic 이 있으면 간단히 필터만 해줌
 */
export function getCourses(params?: GetCoursesParams): MockCourse[] {
  let list = ALL_COURSES;

  if (params?.topic) {
    const mapped = TOPIC_MAP[params.topic] ?? params.topic;
    list = list.filter((c) => c.topic === mapped);
  }

  // 필요하다면 여기서 type 별로 섞거나 slice 해서
  // recent/popular/custom/new 를 흉내낼 수 있음
  return list;
}

/**
 * 단일 코스 + 세션 리스트 조회 (ArticleDetail에서 사용)
 */
export function getCourseDetail(courseId: number) {
  const course = RAW_COURSES.find((c) => c.courseId === courseId);
  if (!course) return null;

  const firstSessionThumb = course.sessions?.[0]?.thumbnailUrl ?? "";

  const sessions: MockSession[] =
    course.sessions?.map((s: RawSession) => ({
      sessionId: s.sessionId,
      thumbnailUrl: s.thumbnailUrl,
      headline: s.headline,
      publisher: s.publisher,
      publishedAt: s.publishedAt,
    })) ?? [];

  return {
    thumbnailUrl: course.thumbnailUrl ?? firstSessionThumb,
    title: course.courseName,
    topic: course.topic ?? null,
    progress: 0, // 더미라 0으로 고정
    longDescription: course.courseDescription,
    sessions,
  };
}

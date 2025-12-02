import styles from "../Learn.module.css";

type Props = {
  course: {
    id: string;
    title: string;
    provider: string;
    minutes: number;
    thumbnail?: string;
  };
};

export default function CourseCardV({ course }: Props) {
  return (
    <article className={styles.cardV} role="button" tabIndex={0}>
      <img
        className={styles.cardVThumb}
        src={course.thumbnail || "/icons/EDU-EDU-01.svg"}
        alt=""
      />
      <div className={styles.cardVMeta}>
        <h3 className={styles.cardVTitle}>{course.title}</h3>
        <p className={styles.cardVSub}>
          {course.provider} · {course.minutes}분
        </p>
      </div>
    </article>
  );
}

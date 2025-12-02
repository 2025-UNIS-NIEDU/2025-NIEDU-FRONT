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

export default function CourseCardH({ course }: Props) {
  return (
    <article className={styles.cardH} role="button" tabIndex={0}>
      <div className={styles.cardHThumbWrap}>
        <img
          className={styles.cardHThumb}
          src={course.thumbnail || "/icons/EDU-EDU-01.svg"}
          alt=""
        />
      </div>
      <h3 className={styles.cardHTitle}>{course.title}</h3>
      <p className={styles.cardHSub}>
        {course.provider} · {course.minutes}분
      </p>
    </article>
  );
}

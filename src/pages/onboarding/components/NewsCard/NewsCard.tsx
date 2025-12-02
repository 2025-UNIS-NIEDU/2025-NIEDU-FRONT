
import styles from "./NewsCard.module.css";

interface NewsCardProps {
  title: string;
  source: string;
}

export default function NewsCard({ title, source }: NewsCardProps) {
  return (
    <div className={styles.card}>
      <img src="/sample-news.png" alt="news" />
      <div className={styles.overlay}>
        <h3>{title}</h3>
        <p>{source}</p>
      </div>
    </div>
  );
}

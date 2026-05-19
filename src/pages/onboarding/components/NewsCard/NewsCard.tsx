import styles from "./NewsCard.module.css";

interface NewsCardProps {
  title: string;
  source: string;
  imageUrl?: string | null;
}

const FALLBACK = "/icons/bunnywithlogo.png"; // ✅ 프로젝트에 실제로 있는 파일로

export default function NewsCard({ title, source, imageUrl }: NewsCardProps) {
  return (
    <div className={styles.card}>
      <img
        src={imageUrl || FALLBACK}
        alt="news"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = FALLBACK;
        }}
      />
      <div className={styles.overlay}>
        <h3>{title}</h3>
        <p>{source}</p>
      </div>
    </div>
  );
}

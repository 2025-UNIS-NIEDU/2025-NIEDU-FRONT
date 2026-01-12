// src/pages/onboarding/components/NewsCard/NewsCard.tsx
import styles from "./NewsCard.module.css";

interface NewsCardProps {
  title: string;
  source: string;
  imageUrl?: string;
}

const FALLBACK_IMG = "/sample-news.png";

export default function NewsCard({ title, source, imageUrl }: NewsCardProps) {
  return (
    <div className={styles.card}>
      <img
        src={imageUrl || FALLBACK_IMG}
        alt="news"
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.src.endsWith(FALLBACK_IMG)) {
            img.src = FALLBACK_IMG;
          }
        }}
      />
      <div className={styles.overlay}>
        <h3>{title}</h3>
        <p>{source}</p>
      </div>
    </div>
  );
}

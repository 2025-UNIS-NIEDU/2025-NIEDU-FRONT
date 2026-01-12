// src/pages/onboarding/components/NewsCard/NewsCard.tsx
import styles from "./NewsCard.module.css";

interface NewsCardProps {
  title: string;
  source: string;
  imageUrl?: string;
}

const FALLBACK = "/icons/bunnywithlogo.png";

const resolveUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  // 백엔드가 "/images/..." 같은 절대경로를 줄 때
  if (url.startsWith("/")) return url;
  return url;
};

export default function NewsCard({ title, source, imageUrl }: NewsCardProps) {
  return (
    <div className={styles.card}>
      <img
        src={resolveUrl(imageUrl) || FALLBACK}
        alt="news"
        onError={(e) => {
          e.currentTarget.src = FALLBACK;
        }}
      />
      <div className={styles.overlay}>
        <h3>{title}</h3>
        <p>{source}</p>
      </div>
    </div>
  );
}

import styles from "./NewsCard.module.css";

interface NewsCardProps {
  title: string;
  source: string;
  imageUrl?: string; // ✅ API 이미지
}

const FALLBACK_IMAGE = "/icons/vite.svg"; // ✅ 실제 존재하는 이미지로

export default function NewsCard({ title, source, imageUrl }: NewsCardProps) {
  return (
    <div className={styles.card}>
      <img
        src={imageUrl || FALLBACK_IMAGE}
        alt="news"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.src.endsWith(FALLBACK_IMAGE)) return;
          img.src = FALLBACK_IMAGE;
        }}
      />
      <div className={styles.overlay}>
        <h3>{title}</h3>
        <p>{source}</p>
      </div>
    </div>
  );
}

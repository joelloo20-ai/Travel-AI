const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80",
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=80",
  "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=1200&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80",
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80",
  "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200&q=80",
];

export function pickCoverImage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return COVER_IMAGES[hash % COVER_IMAGES.length];
}

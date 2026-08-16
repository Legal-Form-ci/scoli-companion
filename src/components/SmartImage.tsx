import { useState, useEffect, forwardRef } from "react";
import React from "react";

type SmartImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
  priority?: boolean; // true = eager load (above-the-fold images)
};

/**
 * Image robuste et optimisée :
 * - priority=true → loading="eager" + fetchpriority="high" (LCP, hero images)
 * - priority=false (default) → loading="lazy" (images hors-écran)
 * - Fallback si URL cassée
 * - Reset quand src change (fix carousel)
 */
const SmartImage = forwardRef<HTMLImageElement, SmartImageProps>(function SmartImage(
  {
    src,
    fallbackSrc = "/placeholder.svg",
    priority = false,
    loading,
    decoding = "async",
    ...props
  },
  ref
) {
  const effectiveSrc = normalizeImageSrc(src, fallbackSrc);
  const [currentSrc, setCurrentSrc] = useState(effectiveSrc);
  const [hasError, setHasError] = useState(false);

  // Reset when src changes (fix carousel issue)
  useEffect(() => {
    const newSrc = normalizeImageSrc(src, fallbackSrc);
    setCurrentSrc(newSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
    props.onError?.(e);
  };

  // priority images load eagerly for best LCP
  const resolvedLoading = loading ?? (priority ? "eager" : "lazy");
  return (
    <img
      {...props}
      ref={ref}
      src={currentSrc}
      loading={resolvedLoading}
      decoding={decoding}
      // @ts-ignore – fetchpriority is a valid HTML attribute
      fetchpriority={priority ? "high" : "auto"}
      onError={handleError}
    />
  );
});

function normalizeImageSrc(src?: string | null, fallbackSrc = "/placeholder.svg") {
  const value = (src || "").trim();
  if (!value || value === "null" || value === "undefined") return fallbackSrc;
  if (value.startsWith("//")) return `https:${value}`;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.startsWith("/")) return value;
  return `/${value.replace(/^\/+/, "")}`;
}

SmartImage.displayName = "SmartImage";

export default SmartImage;

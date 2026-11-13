import React, { useState } from 'react';
import { Newspaper } from 'lucide-react';
import { optimizeCloudinaryUrl, type CloudinaryOptimizeOptions } from '../lib/cloudinary';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  optimize?: CloudinaryOptimizeOptions;
  loading?: 'lazy' | 'eager';
  fallbackLabel?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  optimize,
  loading = 'lazy',
  fallbackLabel,
}) => {
  const [hasError, setHasError] = useState(false);

  const finalSrc = src?.trim()
    ? optimize
      ? optimizeCloudinaryUrl(src.trim(), optimize)
      : src.trim()
    : '';

  if (!finalSrc || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-stone-100 text-stone-400 border border-stone-200 ${className}`}
      >
        <Newspaper className="w-7 h-7 stroke-[1.5] mb-1.5 text-stone-400" />
        <span className="text-[11px] font-medium tracking-wide uppercase text-stone-500 px-3 text-center line-clamp-1">
          {fallbackLabel || 'GATSU WEWARAH'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};

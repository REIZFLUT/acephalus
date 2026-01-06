import * as React from 'react';
import { cn } from '@/lib/utils';

interface ThumbnailUrls {
    small?: string;
    medium?: string;
    large?: string;
}

interface ThumbnailImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    thumbnailUrls?: ThumbnailUrls | null;
    fallbackUrl?: string;
    alt: string;
}

/**
 * Thumbnail sizes in pixels (2x for HiDPI):
 * - small: 80px (for ~40px display)
 * - medium: 300px (for ~150px display)
 * - large: 800px (for ~400px display)
 */
const THUMBNAIL_WIDTHS = {
    small: 80,
    medium: 300,
    large: 800,
} as const;

/**
 * Generate srcset string from thumbnail URLs.
 * Uses width descriptors (w) so the browser can choose based on
 * the actual rendered size and device pixel ratio.
 */
function generateSrcSet(thumbnailUrls: ThumbnailUrls): string {
    const parts: string[] = [];

    if (thumbnailUrls.small) {
        parts.push(`${thumbnailUrls.small} ${THUMBNAIL_WIDTHS.small}w`);
    }
    if (thumbnailUrls.medium) {
        parts.push(`${thumbnailUrls.medium} ${THUMBNAIL_WIDTHS.medium}w`);
    }
    if (thumbnailUrls.large) {
        parts.push(`${thumbnailUrls.large} ${THUMBNAIL_WIDTHS.large}w`);
    }

    return parts.join(', ');
}

/**
 * Get the best single URL from thumbnail URLs (for src fallback).
 */
function getBestUrl(thumbnailUrls: ThumbnailUrls | null | undefined, fallbackUrl?: string): string | undefined {
    if (!thumbnailUrls) return fallbackUrl;
    return thumbnailUrls.medium || thumbnailUrls.small || thumbnailUrls.large || fallbackUrl;
}

/**
 * A responsive thumbnail image component that uses srcset to let
 * the browser choose the optimal image size based on display DPI
 * and container size.
 *
 * @example
 * // In a 40px container
 * <ThumbnailImage
 *   thumbnailUrls={media.thumbnail_urls}
 *   fallbackUrl={media.url}
 *   alt={media.original_filename}
 *   sizes="40px"
 *   className="w-full h-full object-cover"
 * />
 *
 * @example
 * // In a responsive grid
 * <ThumbnailImage
 *   thumbnailUrls={media.thumbnail_urls}
 *   fallbackUrl={media.url}
 *   alt={media.original_filename}
 *   sizes="(min-width: 640px) 150px, 100px"
 *   className="w-full h-full object-cover"
 * />
 */
export function ThumbnailImage({
    thumbnailUrls,
    fallbackUrl,
    alt,
    sizes,
    className,
    ...props
}: ThumbnailImageProps) {
    const srcSet = thumbnailUrls ? generateSrcSet(thumbnailUrls) : undefined;
    const src = getBestUrl(thumbnailUrls, fallbackUrl);

    if (!src) {
        return null;
    }

    return (
        <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            className={cn(className)}
            loading="lazy"
            decoding="async"
            {...props}
        />
    );
}

export { generateSrcSet, getBestUrl, THUMBNAIL_WIDTHS };
export type { ThumbnailUrls };


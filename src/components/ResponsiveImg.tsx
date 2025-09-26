"use client";

import React, { forwardRef, useMemo } from 'react';
import { AVIF_TARGET_WIDTHS, buildSrcSet, defaultSizesAttr } from '@/lib/images';

export interface ResponsiveImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  sizesAttr?: string;
}

const ResponsiveImg = forwardRef<HTMLImageElement, ResponsiveImgProps>(
  ({ src, alt, className, sizesAttr, ...rest }, ref) => {
    const { srcSet, sizes } = useMemo(() => {
      try {
        const m = src.match(/^(.*)-w(\d+)\.avif(\?.*)?$/);
        if (!m) return { srcSet: undefined, sizes: undefined };
        const [, prefix, maxStr, query = ''] = m;
        const max = Number(maxStr);
        if (!Number.isFinite(max)) return { srcSet: undefined, sizes: undefined };
        const widths = AVIF_TARGET_WIDTHS.filter((w) => w <= max);
        const urlsByWidth: Record<number, string> = {};
        for (const w of widths) {
          urlsByWidth[w] = `${prefix}-w${w}.avif${query}`;
        }
        return { srcSet: buildSrcSet(urlsByWidth), sizes: sizesAttr || defaultSizesAttr() };
      } catch {
        return { srcSet: undefined, sizes: undefined };
      }
    }, [src, sizesAttr]);

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        srcSet={srcSet}
        sizes={sizes}
        loading="lazy"
        {...rest}
      />
    );
  }
);

export default ResponsiveImg;



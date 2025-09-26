"use client";

import { useRef, useState } from 'react';
import { compressToAvifVariants } from '@/lib/imageCompression';
import ResponsiveImg from '@/components/ResponsiveImg';

export interface ImageUploaderProps {
  adId?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export default function ImageUploader({ adId, value, onChange, max = 20 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const existing = value.length;
    const remaining = Math.max(0, max - existing);
    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        // Compress to AVIF variants on the client
        const variants = await compressToAvifVariants(file);
        // Upload each variant with a width-suffixed filename
        const base = (file.name || 'image').replace(/\.[^.]+$/, '');
        const groupId = Date.now();
        const widthToUrl = new Map<number, string>();
        for (const v of variants) {
          const filename = `${base}-w${v.width}.avif`;
          const avifFile = new File([v.blob], filename, { type: 'image/avif' });
          const form = new FormData();
          form.append('file', avifFile);
          if (adId) form.append('adId', adId);
          form.append('filename', filename);
          form.append('groupId', String(groupId));
          const res = await fetch('/api/uploads/ad-images', { method: 'POST', body: form, cache: 'no-store' });
          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          widthToUrl.set(v.width, String(data.url));
        }
        // Store the largest width variant URL as the canonical photo URL
        const maxWidth = Math.max(...variants.map(v => v.width));
        const canonical = widthToUrl.get(maxWidth);
        if (canonical) {
          uploaded.push(canonical);
        }
      }
      onChange([...(value || []), ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(src: string, idx: number) {
    try {
      const url = new URL(src, window.location.origin);
      const res = await fetch(`/api/uploads/ad-images?url=${encodeURIComponent(url.pathname)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch {}
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {value?.map((src, idx) => (
          <div key={idx} className="relative w-24 h-24 border rounded overflow-hidden bg-gray-50">
            <ResponsiveImg src={src} alt="ad" className="w-full h-full object-cover" sizesAttr="96px" />
            <button type="button" onClick={() => handleDelete(src, idx)} className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
              ✕
            </button>
          </div>
        ))}
        {value.length < max && (
          <label className="w-24 h-24 border-dashed border-2 border-gray-300 rounded flex items-center justify-center cursor-pointer hover:bg-gray-50">
            <span className="text-xs text-gray-600 text-center px-2">{uploading ? 'Uploading…' : 'Add photo'}</span>
            <input ref={inputRef} onChange={(e) => handleFiles(e.target.files)} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" multiple />
          </label>
        )}
      </div>
      <p className="text-xs text-gray-500">Up to {max} images. JPG/PNG/WebP, max 10MB each.</p>
    </div>
  );
}



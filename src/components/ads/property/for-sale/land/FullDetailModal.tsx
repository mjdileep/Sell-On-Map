"use client";

import { useEffect } from "react";
import type { Rental as Ad } from "@/types/rental";
import AdTopSummary from "@/components/ads/shared/AdTopSummary";
import AdContactInfo from "@/components/ads/shared/AdContactInfo";
import AdListedFooter from "@/components/ads/shared/AdListedFooter";
import { slugify } from "@/lib/slug";
import Modal from "@/components/Modal";
import { unitNames } from "@/lib/unitNames";
import { pricePerPerch } from "@/lib/area";
import { formatCurrency } from "@/lib/currencyUtils";
import FullDetail from "./FullDetail";

export default function LandFullDetailModal({ open, ad, onClose }: { open: boolean, ad: Ad | null, onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open || !ad) return null;
  return (
    <Modal open={open} onClose={onClose} title={ad.title}  closeOnBackdrop={true}>
      <div className="bg-white w-full min-w-xs sm:min-w-sm md:min-w-md lg:min-w-lg xl:min-w-2xl max-w-2xl rounded-2xl overflow-hidden">
        <div className="space-y-1 max-h-[75vh] overflow-y-auto">
          <FullDetail ad={ad as any} />
        </div>
        <AdListedFooter createdAt={ad.createdAt} categoryLabel={ad.category?.split('.').slice(1).map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).replace('-', ' ')).join(' • ')} linkHref={`/ad/${ad.id}/${slugify(ad.title)}`} mode="footer" />
      </div>
    </Modal>
  );
}



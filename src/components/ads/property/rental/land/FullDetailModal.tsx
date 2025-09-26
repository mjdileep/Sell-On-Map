"use client";
import { useEffect } from "react";
import type { Rental } from "@/types/rental";
import AdTopSummary from "@/components/ads/shared/AdTopSummary";
import AdContactInfo from "@/components/ads/shared/AdContactInfo";
import AdListedFooter from "@/components/ads/shared/AdListedFooter";
import { slugify } from "@/lib/slug";
import Modal from "@/components/Modal";
import { unitNames } from "@/lib/unitNames";
import FullDetail from "./FullDetail";

export interface FullDetailModalProps {
  open: boolean;
  rental: Rental | null;
  onClose: () => void;
}

export default function FullDetailModal({ open, rental, onClose }: FullDetailModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !rental) return null;

  return (
    <Modal open={open} onClose={onClose} title={rental.title}>
      <div className="bg-white w-full min-w-xs sm:min-w-sm md:min-w-md lg:min-w-lg xl:min-w-2xl max-w-2xl rounded-2xl overflow-hidden">
        <div className="p-2 md:p-4 space-y-3 max-h-[75vh] overflow-y-auto">
          <FullDetail ad={rental as any} />
        </div>
        <AdListedFooter createdAt={rental.createdAt} categoryLabel={rental.category?.split('.').slice(1).map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).replace('-', ' ')).join(' • ')} linkHref={`/ad/${rental.id}/${slugify(rental.title)}`} mode="footer" />
      </div>
    </Modal>
  );
}



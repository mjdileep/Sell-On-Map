"use client";
import { X } from "lucide-react";
import { useEffect } from "react";
import type { Rental as Ad } from "@/types/rental";
import { formatCurrency } from "@/lib/currencyUtils";
import AdTopSummary from "@/components/ads/shared/AdTopSummary";
import AdListedFooter from "@/components/ads/shared/AdListedFooter";
import Modal from "@/components/Modal";
import FullDetail from "./FullDetail";

export default function ClothingFullDetailModal({ open, ad, onClose }: { open: boolean, ad: Ad | null, onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open || !ad) return null;
  return (
    <Modal open={open} onClose={onClose} title={ad.title}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
          <FullDetail ad={ad as any} />
        </div>
      </div>
    </Modal>
  );
}



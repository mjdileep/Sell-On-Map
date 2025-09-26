"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  zIndexClass?: string; // e.g. z-[1100]
  backdropClassName?: string; // customize backdrop if needed
  containerClassName?: string; // customize container padding
  closeOnBackdrop?: boolean;
  title?: string;
};

export default function Modal({
  open,
  onClose,
  children,
  zIndexClass = "z-[1100]",
  backdropClassName = "absolute inset-0 bg-black/50",
  containerClassName = "absolute inset-0 flex items-center justify-center",
  closeOnBackdrop = true,
  title
}: ModalProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 ${zIndexClass}`}
      onClick={() => {
        if (closeOnBackdrop) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={backdropClassName} />
      <div
        className={containerClassName}
        onClick={(e) =>{if (closeOnBackdrop) onClose(); e.stopPropagation()}}
      >
        <div className="bg-white rounded-2xl p-2 md:p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button aria-label="Close" onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X className="h-5 w-5" /></button>
          </div>
        {children}
        </div>
      </div>
    </div>
  );
}



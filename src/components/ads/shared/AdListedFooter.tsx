"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

export interface AdListedFooterProps {
  createdAt: string | number | Date;
  categoryLabel?: string;
  linkHref?: string;
  linkText?: string;
  mode?: "inline" | "footer" | "both";
}

function formatUtcTimestamp(value: string | number | Date): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}:${ss} UTC`;
}

export default function AdListedFooter({ createdAt, categoryLabel, linkHref, linkText = "Open", mode = "inline" }: AdListedFooterProps) {
  const showInline = mode === "inline" || mode === "both";
  const showFooter = (mode === "footer" || mode === "both") && (categoryLabel || linkHref);
  return (
    <>
      {showInline && (
        <div className="text-xs text-gray-400">Listed: {formatUtcTimestamp(createdAt)}</div>
      )}
      {showFooter && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-2">
          <span className="text-sm text-gray-500">{categoryLabel || ""}</span>
          {linkHref && (
            <Link target="_blank" href={linkHref} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium">
              {linkText}
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </>
  );
}



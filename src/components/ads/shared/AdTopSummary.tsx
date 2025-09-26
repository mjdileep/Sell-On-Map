"use client";

import ImageSlider from "@/components/ImageSlider";
import { formatCurrency } from "@/lib/currencyUtils";

export interface AdTopSummaryProps {
  images?: string[] | null;
  title: string;
  description?: string | null;
  price: number;
  currency?: string;
  priceSuffix?: string;
  priceClassName?: string;
  address?: string | null;
  lat?: number;
  lng?: number;
}

export default function AdTopSummary({
  images,
  title,
  description,
  price,
  currency = "USD",
  priceSuffix,
  priceClassName,
  address,
  lat,
  lng,
}: AdTopSummaryProps) {
  const destination = (typeof lat === 'number' && typeof lng === 'number')
    ? `${lat},${lng}`
    : (address ? encodeURIComponent(address) : undefined);
  const mapsUrl = destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${destination}&dir_action=navigate`
    : undefined;
  return (
    <div className="">
      {Array.isArray(images) && images.length > 0 && (
        <ImageSlider images={images} alt={title} />
      )}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mt-2">
        <span className={`text-xl font-semibold ${priceClassName || "text-blue-700"}`}>
          {formatCurrency(price, currency)}<span className="text-sm text-gray-600 ml-1">{priceSuffix || ""}</span>
        </span>
        {address && (
          <span className="flex items-center justify-end gap-2 text-right">
            <span className="text-sm text-gray-600">{address}</span>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get directions on Google Maps"
                title="Directions"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
              >
                {/* Google-like navigation icon (paper plane) */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M22.43 10.59l-9.01-9.01c-.75-.75-2.07-.76-2.83 0l-9 9c-.78.78-.78 2.04 0 2.82l9 9c.39.39.9.58 1.41.58c.51 0 1.02-.19 1.41-.58l8.99-8.99c.79-.76.8-2.02.03-2.82zm-10.42 10.4l-9-9l9-9l9 9l-9 9zM8 11v4h2v-3h4v2.5l3.5-3.5L14 7.5V10H9c-.55 0-1 .45-1 1z"
                    fill="#2563eb"
                  />
                </svg>
              </a>
            )}
          </span>
        )}
      </div>
      {description && (
        <div className="text-gray-700 leading-relaxed">{description}</div>
      )}
    </div>
  );
}



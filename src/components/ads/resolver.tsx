"use client";

import type { ComponentType } from "react";
import type { Rental as Ad } from "@/types/rental";

// Create modals
import RentalLandCreateAdModal from "@/components/ads/property/rental/land/CreateAdModal";
import RentalBuildingCreateAdModal from "@/components/ads/property/rental/building/CreateAdModal";
import LandCreateAdModal from "@/components/ads/property/for-sale/land/CreateAdModal";
import BuildingCreateAdModal from "@/components/ads/property/for-sale/building/CreateAdModal";

// Edit modals
import RentalLandEditAdModal from "@/components/ads/property/rental/land/EditAdModal";
import RentalBuildingEditAdModal from "@/components/ads/property/rental/building/EditAdModal";
import LandSaleEditAdModal from "@/components/ads/property/for-sale/land/EditAdModal";
import BuildingSaleEditAdModal from "@/components/ads/property/for-sale/building/EditAdModal";

// Detail modals (note: rental uses prop name 'rental')
import RentalLandDetailModal from "@/components/ads/property/rental/land/FullDetailModal";
import RentalBuildingDetailModal from "@/components/ads/property/rental/building/FullDetailModal";
import LandDetailModal from "@/components/ads/property/for-sale/land/FullDetailModal";
import BuildingDetailModal from "@/components/ads/property/for-sale/building/FullDetailModal";

// Full details (for reuse outside modals)
import RentalLandFullDetail from "@/components/ads/property/rental/land/FullDetail";
import RentalBuildingFullDetail from "@/components/ads/property/rental/building/FullDetail";
import LandFullDetail from "@/components/ads/property/for-sale/land/FullDetail";
import BuildingFullDetail from "@/components/ads/property/for-sale/building/FullDetail";

// List previews (optional, not currently wired globally)
import RentalLandListPreview from "@/components/ads/property/rental/land/ListPreview";
import RentalBuildingListPreview from "@/components/ads/property/rental/building/ListPreview";
import LandListPreview from "@/components/ads/property/for-sale/land/ListPreview";
import BuildingListPreview from "@/components/ads/property/for-sale/building/ListPreview";

// My Listings cards
import RentalLandMyListingCard from "@/components/ads/property/rental/land/MyListingCard";
import RentalBuildingMyListingCard from "@/components/ads/property/rental/building/MyListingCard";
import LandMyListingCard from "@/components/ads/property/for-sale/land/MyListingCard";
import BuildingMyListingCard from "@/components/ads/property/for-sale/building/MyListingCard";

// Markers
import { createSaleLandMarkerElement, createSaleLandResidentialMarkerElement, createSaleLandCommercialMarkerElement, createSaleLandIndustrialMarkerElement, createSaleLandAgriculturalMarkerElement } from "@/components/ads/property/for-sale/land/Marker";
import { createSaleBuildingMarkerElement, createSaleBuildingResidentialSingleFamilyMarkerElement, createSaleBuildingResidentialMultiFamilyMarkerElement, createSaleBuildingResidentialCondoTownhouseMarkerElement, createSaleBuildingCommercialOfficeMarkerElement, createSaleBuildingCommercialRetailMarkerElement, createSaleBuildingIndustrialWarehouseMarkerElement, createSaleBuildingIndustrialManufacturingMarkerElement, createSaleBuildingMixedUseMarkerElement, createSaleBuildingHospitalityMarkerElement } from "@/components/ads/property/for-sale/building/Marker";
import { createRentalLandCommercialMarkerElement, createRentalLandIndustrialMarkerElement, createRentalLandAgriculturalMarkerElement } from "@/components/ads/property/rental/land/Marker";
import { createRentalBuildingResidentialMarkerElement, createRentalBuildingCommercialOfficeMarkerElement, createRentalBuildingCommercialRetailMarkerElement, createRentalBuildingIndustrialWarehouseMarkerElement, createRentalBuildingIndustrialManufacturingMarkerElement, createRentalBuildingMixedUseMarkerElement, createRentalBuildingHospitalityMarkerElement } from "@/components/ads/property/rental/building/Marker";

export type CategoryKey = string;

export type ResolvedCreateModal = ComponentType<{ open: boolean; onClose: () => void; onCreated?: () => void; category?: string }> | null;
export type ResolvedDetailModal = ComponentType<{ open: boolean; ad: Ad | null; onClose: () => void }> | null;
export type ResolvedListPreview = ComponentType<any> | null;
export type ResolvedMyListingCard = ComponentType<{ ad: Ad }> | null;
export type ResolvedEditModal = ComponentType<{ open: boolean; onClose: () => void; adId: string; onSaved?: () => void }> | null;
export type ResolvedFullDetail = ComponentType<{ ad: Ad }> | null;

export type MarkerFactory = (ad: Ad, markerVariant: "full" | "dot") => HTMLDivElement;

function normalizeCategory(key?: string | null): string {
  const c = (key || "").trim();
  if (!c || c === "all") return "all";
  return c
    .replace(/\s+/g, "")
    .replace(/_/g, ".")
    .replace(/\/+/, ".")
    .replace(/\.+/g, ".")
    .replace(/\.$/, "");
}

function buildDescendingPrefixes(category: string): string[] {
  if (!category || category === "all") return [];
  const parts = category.split(".");
  const prefixes: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    prefixes.push(parts.slice(0, i + 1).join("."));
  }
  return prefixes;
}

// Registry of components at specific hierarchy nodes.
// Rule: We "travel down" from the top along the category path and use the first component we find.
const createModalRegistry: Record<string, ResolvedCreateModal> = {
  // Rentals
  "property.rental.land": RentalLandCreateAdModal,
  "property.rental.building": RentalBuildingCreateAdModal,

  // For Sale
  "property.for-sale.land": LandCreateAdModal,
  "property.for-sale.building": BuildingCreateAdModal,
};

const editModalRegistry: Record<string, ResolvedEditModal> = {
  // Rentals
  "property.rental.land": RentalLandEditAdModal,
  "property.rental.building": RentalBuildingEditAdModal,

  // For Sale
  "property.for-sale.land": LandSaleEditAdModal,
  "property.for-sale.building": BuildingSaleEditAdModal,
};

const detailModalRegistry: Record<string, ResolvedDetailModal> = {
  // Rental land/building use their own detail modals (prop name 'rental')
  "property.rental.land": ((props: { open: boolean; ad: Ad | null; onClose: () => void }) => (
    <RentalLandDetailModal open={props.open} rental={props.ad} onClose={props.onClose} />
  )) as any,
  "property.rental.building": ((props: { open: boolean; ad: Ad | null; onClose: () => void }) => (
    <RentalBuildingDetailModal open={props.open} rental={props.ad} onClose={props.onClose} />
  )) as any,

  // For Sale
  "property.for-sale.land": ((props: { open: boolean; ad: Ad | null; onClose: () => void }) => (
    <LandDetailModal open={props.open} ad={props.ad} onClose={props.onClose} />
  )) as any,

  "property.for-sale.building": ((props: { open: boolean; ad: Ad | null; onClose: () => void }) => (
    <BuildingDetailModal open={props.open} ad={props.ad} onClose={props.onClose} />
  )) as any,
};

const fullDetailRegistry: Record<string, ResolvedFullDetail> = {
  "property.rental.land": RentalLandFullDetail,
  "property.rental.building": RentalBuildingFullDetail,
  "property.for-sale.land": LandFullDetail,
  "property.for-sale.building": BuildingFullDetail,
};

const listPreviewRegistry: Record<string, ResolvedListPreview> = {
  // Rental list previews per branch
  "property.rental.land": RentalLandListPreview as any,
  "property.rental.building": RentalBuildingListPreview as any,
  // For Sale
  "property.for-sale.land": LandListPreview as any,
  "property.for-sale.building": BuildingListPreview as any,
};

const myListingCardRegistry: Record<string, ResolvedMyListingCard> = {
  "property.rental.land": RentalLandMyListingCard,
  "property.rental.building": RentalBuildingMyListingCard,
  "property.for-sale.land": LandMyListingCard,
  "property.for-sale.building": BuildingMyListingCard,
};

const markerRegistry: Record<string, MarkerFactory> = {
  "property.for-sale.land": createSaleLandMarkerElement,
  "property.for-sale.building": createSaleBuildingMarkerElement,

  // Rental land leaves
  "property.rental.land.commercial": createRentalLandCommercialMarkerElement,
  "property.rental.land.industrial": createRentalLandIndustrialMarkerElement,
  "property.rental.land.agricultural": createRentalLandAgriculturalMarkerElement,

  // Rental building leaves
  "property.rental.building.residential": createRentalBuildingResidentialMarkerElement,
  // Broader fallbacks for new subtypes
  "property.rental.building.commercial": createRentalBuildingCommercialOfficeMarkerElement,
  "property.rental.building.commercial.office": createRentalBuildingCommercialOfficeMarkerElement,
  "property.rental.building.commercial.retail": createRentalBuildingCommercialRetailMarkerElement,
  "property.rental.building.industrial": createRentalBuildingIndustrialManufacturingMarkerElement,
  "property.rental.building.industrial.warehouse": createRentalBuildingIndustrialWarehouseMarkerElement,
  "property.rental.building.industrial.manufacturing": createRentalBuildingIndustrialManufacturingMarkerElement,
  "property.rental.building.hospitality": createRentalBuildingHospitalityMarkerElement,

  // Sale land leaves
  "property.for-sale.land.residential": createSaleLandResidentialMarkerElement,
  "property.for-sale.land.commercial": createSaleLandCommercialMarkerElement,
  "property.for-sale.land.industrial": createSaleLandIndustrialMarkerElement,
  "property.for-sale.land.agricultural": createSaleLandAgriculturalMarkerElement,

  // Sale building leaves
  "property.for-sale.building.residential.single-family": createSaleBuildingResidentialSingleFamilyMarkerElement,
  "property.for-sale.building.residential.multi-family": createSaleBuildingResidentialMultiFamilyMarkerElement,
  "property.for-sale.building.residential.condo-townhouse": createSaleBuildingResidentialCondoTownhouseMarkerElement,
  "property.for-sale.building.commercial.office": createSaleBuildingCommercialOfficeMarkerElement,
  "property.for-sale.building.commercial.retail": createSaleBuildingCommercialRetailMarkerElement,
  "property.for-sale.building.industrial.warehouse": createSaleBuildingIndustrialWarehouseMarkerElement,
  "property.for-sale.building.industrial.manufacturing": createSaleBuildingIndustrialManufacturingMarkerElement,
  "property.for-sale.building.mixed-use": createSaleBuildingMixedUseMarkerElement,
  "property.for-sale.building.hospitality": createSaleBuildingHospitalityMarkerElement,
};

export function resolveCreateAdModal(category: CategoryKey): ResolvedCreateModal {
  const cat = normalizeCategory(category);
  const prefixes = buildDescendingPrefixes(cat);
  for (let i = prefixes.length - 1; i >= 0; i--) {
    const mod = createModalRegistry[prefixes[i]];
    if (mod) return mod;
  }
  return null;
}

export function resolveEditAdModal(category: CategoryKey): ResolvedEditModal {
  const cat = normalizeCategory(category);
  const prefixes = buildDescendingPrefixes(cat);
  for (let i = prefixes.length - 1; i >= 0; i--) {
    const mod = editModalRegistry[prefixes[i]];
    if (mod) return mod;
  }
  return null;
}

export function resolveDetailModal(category: CategoryKey): ResolvedDetailModal {
  const cat = normalizeCategory(category);
  const prefixes = buildDescendingPrefixes(cat);
  for (let i = prefixes.length - 1; i >= 0; i--) {
    const mod = detailModalRegistry[prefixes[i]];
    if (mod) return mod;
  }
  return null;
}

export function resolveFullDetail(category: CategoryKey): ResolvedFullDetail {
  const cat = normalizeCategory(category);
  const prefixes = buildDescendingPrefixes(cat);
  for (let i = prefixes.length - 1; i >= 0; i--) {
    const comp = fullDetailRegistry[prefixes[i]];
    if (comp) return comp;
  }
  return null;
}

export function resolveListPreview(category: CategoryKey): ResolvedListPreview {
  const cat = normalizeCategory(category);
  const prefixes = buildDescendingPrefixes(cat);
  for (let i = prefixes.length - 1; i >= 0; i--) {
    const comp = listPreviewRegistry[prefixes[i]];
    if (comp) return comp;
  }
  return null;
}

export function resolveMyListingCard(category: CategoryKey): ResolvedMyListingCard {
  const cat = normalizeCategory(category);
  const prefixes = buildDescendingPrefixes(cat);
  for (let i = prefixes.length - 1; i >= 0; i--) {
    const comp = myListingCardRegistry[prefixes[i]];
    if (comp) return comp;
  }
  return null;
}

export function createMarkerElementForAd(ad: Ad, markerVariant: "full" | "dot" = "full"): HTMLDivElement {
  const category = normalizeCategory(ad?.category || "");
  const prefixes = buildDescendingPrefixes(category);
  // Prefer the most specific (leaf) marker override if present
  for (let i = prefixes.length - 1; i >= 0; i--) {
    const prefix = prefixes[i];
    const factory = markerRegistry[prefix];
    if (factory) return factory(ad, markerVariant);
  }
  // Default dot marker
  const el = document.createElement("div");
  el.className = "ml-dot-marker";
  el.style.cssText =
    "width:8px;height:8px;border-radius:9999px;background:#374151;border:2px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,.3);cursor:pointer;";
  return el as HTMLDivElement;
}

export function isPropertyCategory(category?: string | null): boolean {
  const cat = normalizeCategory(category);
  return cat === "property" || cat.startsWith("property.");
}



"use client";

import { Home, Building2, Shirt, Landmark, ChevronDown, Layers, Car, Bike } from "lucide-react";
import { useMemo, useState } from "react";
import { useConfig } from "@/app/config-context";
import type { CategoryNode as RawCategoryNode } from "@/lib/categories";

type CategoryKey = string;

export interface CategoryTabsProps {
  active: CategoryKey;
  onChange: (key: CategoryKey) => void;
  compact?: boolean;
}

interface CategoryNode {
  key: CategoryKey;
  label: string;
  Icon?: React.ComponentType<{ className?: string }>;
  enabled?: boolean;
  children?: CategoryNode[];
}

const fallbackCategoryTree: CategoryNode = {
  key: "all",
  label: "All",
  Icon: Layers,
  enabled: true,
  children: [
    {
      key: "property",
      label: "Property",
      Icon: Home,
      enabled: true,
      children: [
        {
          key: "property.rental",
          label: "Rental",
          Icon: Home,
          enabled: true,
          children: [
            {
              key: "property.rental.land",
              label: "Land",
              Icon: Landmark,
              enabled: true,
              children: [
                { key: "property.rental.land.residential", label: "Residential", enabled: true },
                { key: "property.rental.land.commercial", label: "Commercial", enabled: true },
                { key: "property.rental.land.industrial", label: "Industrial", enabled: true },
                { key: "property.rental.land.agricultural", label: "Agricultural", enabled: true },
              ],
            },
            {
              key: "property.rental.building",
              label: "Building",
              Icon: Building2,
              enabled: true,
              children: [
                {
                  key: "property.rental.building.residential",
                  label: "Residential",
                  enabled: true,
                  children: [
                    { key: "property.rental.building.residential.single-family", label: "Single Family", enabled: true },
                    { key: "property.rental.building.residential.multi-family", label: "Multi Family", enabled: true },
                    { key: "property.rental.building.residential.condo-townhouse", label: "Condo/Townhouse", enabled: true },
                  ],
                },
                {
                  key: "property.rental.building.commercial",
                  label: "Commercial",
                  enabled: true,
                  children: [
                    { key: "property.rental.building.commercial.office", label: "Office", enabled: true },
                    { key: "property.rental.building.commercial.retail", label: "Retail", enabled: true },
                  ],
                },
                {
                  key: "property.rental.building.industrial",
                  label: "Industrial",
                  enabled: true,
                  children: [
                    { key: "property.rental.building.industrial.warehouse", label: "Warehouse", enabled: true },
                    { key: "property.rental.building.industrial.manufacturing", label: "Manufacturing", enabled: true },
                  ],
                },
                { key: "property.rental.building.mixed-use", label: "Mixed Use", enabled: true },
                { key: "property.rental.building.hospitality", label: "Hospitality", enabled: true },
              ],
            },
          ],
        },
        {
          key: "property.for-sale",
          label: "For Sale",
          Icon: Landmark,
          enabled: true,
          children: [
            {
              key: "property.for-sale.land",
              label: "Land",
              Icon: Landmark,
              enabled: true,
              children: [
                { key: "property.for-sale.land.residential", label: "Residential", enabled: true },
                { key: "property.for-sale.land.commercial", label: "Commercial", enabled: true },
                { key: "property.for-sale.land.industrial", label: "Industrial", enabled: true },
                { key: "property.for-sale.land.agricultural", label: "Agricultural", enabled: true },
              ],
            },
            {
              key: "property.for-sale.building",
              label: "Building",
              Icon: Building2,
              enabled: true,
              children: [
                {
                  key: "property.for-sale.building.residential",
                  label: "Residential",
                  enabled: true,
                  children: [
                    { key: "property.for-sale.building.residential.single-family", label: "Single Family", enabled: true },
                    { key: "property.for-sale.building.residential.multi-family", label: "Multi Family", enabled: true },
                    { key: "property.for-sale.building.residential.condo-townhouse", label: "Condo/Townhouse", enabled: true },
                  ],
                },
                {
                  key: "property.for-sale.building.commercial",
                  label: "Commercial",
                  enabled: true,
                  children: [
                    { key: "property.for-sale.building.commercial.office", label: "Office", enabled: true },
                    { key: "property.for-sale.building.commercial.retail", label: "Retail", enabled: true },
                  ],
                },
                {
                  key: "property.for-sale.building.industrial",
                  label: "Industrial",
                  enabled: true,
                  children: [
                    { key: "property.for-sale.building.industrial.warehouse", label: "Warehouse", enabled: true },
                    { key: "property.for-sale.building.industrial.manufacturing", label: "Manufacturing", enabled: true },
                  ],
                },
                { key: "property.for-sale.building.mixed-use", label: "Mixed Use", enabled: true },
                { key: "property.for-sale.building.hospitality", label: "Hospitality", enabled: true },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function transform(node: RawCategoryNode): CategoryNode {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Home,
    Building2,
    Shirt,
    Landmark,
    Layers,
    Car,
    Bike,
  } as any;
  const Icon = node.icon && iconMap[node.icon] ? iconMap[node.icon] : undefined;
  return {
    key: node.key as CategoryKey,
    label: node.label,
    Icon,
    enabled: node.enabled !== false,
    children: Array.isArray(node.children) ? node.children.map(transform) : [],
  };
}

function findNode(root: CategoryNode, key: CategoryKey): CategoryNode | null {
  if (root.key === key) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNode(child, key);
    if (found) return found;
  }
  return null;
}

function getPath(root: CategoryNode, key: CategoryKey): CategoryNode[] {
  const path: CategoryNode[] = [];
  function dfs(node: CategoryNode): boolean {
    path.push(node);
    if (node.key === key) return true;
    if (node.children) {
      for (const child of node.children) {
        if (dfs(child)) return true;
      }
    }
    path.pop();
    return false;
  }
  dfs(root);
  return path;
}

function topLevelOf(key: CategoryKey): CategoryKey {
  if (!key || key === 'all') return 'all';
  return key.split('.')[0];
}

export default function CategoryTabs({ active, onChange, compact = false }: CategoryTabsProps) {
  const [open, setOpen] = useState(false);
  const { categories: rawCategories } = useConfig();
  const categoryTree = useMemo(() => (rawCategories ? transform(rawCategories as RawCategoryNode) : fallbackCategoryTree), [rawCategories]);

  const effectiveActiveKey = useMemo(() => {
    const children = categoryTree.children || [];
    if (children.length === 1 && (active === 'all' || !active)) {
      return children[0].key;
    }
    return active;
  }, [active, categoryTree]);

  const topTabs = useMemo(() => {
    const children = categoryTree.children || [];
    // If there's only one child under root, use just that child without "All"
    if (children.length === 1) {
      return children;
    }
    // Otherwise include "All" option
    return [{ key: 'all', label: 'All', Icon: Layers, enabled: true } as CategoryNode, ...children];
  }, [categoryTree]);

  const currentTopKey = useMemo(() => {
    return topLevelOf(effectiveActiveKey);
  }, [effectiveActiveKey]);

  const currentTop = useMemo(() => topTabs.find(t => t.key === currentTopKey) || topTabs[0], [topTabs, currentTopKey]);

  const activeNode = useMemo(() => findNode(categoryTree, effectiveActiveKey) || currentTop, [effectiveActiveKey, currentTop, categoryTree]);
  const breadcrumbs = useMemo(() => getPath(categoryTree, effectiveActiveKey).slice(1), [effectiveActiveKey, categoryTree]); // exclude virtual root
  const children = activeNode?.children || [];
  const activeLevel = useMemo(() => getPath(categoryTree, effectiveActiveKey).length, [effectiveActiveKey, categoryTree]);

  if (compact) {
    const CurrentIcon = (activeNode?.Icon || currentTop?.Icon || Layers);
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-100 transition-colors`}
          aria-expanded={open}
        >
          {CurrentIcon ? <CurrentIcon className={`h-4 w-4 mr-2`} /> : null}
          <span>{activeNode?.label || topTabs[0]?.label || 'All'}</span>
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className={`absolute z-10 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-md max-h-96 overflow-y-auto`}
          >
            <div className="p-2 border-b text-xs text-gray-500 font-semibold">Top Level</div>
            <div className="p-2 space-y-1">
              {topTabs.map(t => (
                <button key={t.key} onClick={() => { onChange(t.key as string); setOpen(false); }} className={`w-full text-left px-3 py-1.5 rounded ${t.key === currentTopKey ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>{t.label}</button>
              ))}
            </div>
            <div className="p-2 border-t text-xs text-gray-500 font-semibold">Current Level</div>
            <div className="p-2 space-y-1">
              {children.length === 0 ? (
                <div className="text-gray-400 text-sm px-3 py-1.5">No subcategories</div>
              ) : children.map(c => (
                <button key={c.key} onClick={() => { onChange(c.key); setOpen(false); }} className={`w-full text-left px-3 py-1.5 rounded ${c.key === active ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>{c.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="lg:hidden">
        {/* Breadcrumbs for deeper levels beyond the immediate children */}
        {breadcrumbs.length > 0 && (activeLevel > 2 || children.length > 0) && (
          <div className="w-full overflow-x-auto p-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 w-fit mx-auto">
              <div className="flex items-center bg-white rounded-md shadow-[0_-4px_15px_rgba(0,0,0,0.1)] px-2">
                {breadcrumbs.map((node, idx) => ( //skip the first one
                  <span key={node.key} className="flex items-center gap-1">
                    <span className="text-gray-300 px-1">➤</span> 
                    <button
                      onClick={() => {
                        const isActiveCrumb = node.key === active;
                        const parentKey = idx === 0 ? breadcrumbs[0]?.key : breadcrumbs[idx]?.key;
                        onChange(isActiveCrumb ? (parentKey ?? node.key) : node.key);
                      }}
                      className={`py-1 rounded hover:bg-gray-100 whitespace-nowrap ${node.key === active ? 'text-blue-700 font-semibold' : ''}`}
                      title={node.label}
                    >
                      {node.label}
                    </button>
                  </span>
                ))}
              </div>

              {/* Expanded children at the bottom-right, skip when 'All' is selected */}
              {currentTopKey !== 'all' && children.length > 0 && (
                <div className="flex items-center gap-1 justify-end">
                  {children.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => onChange(c.key)}
                      className={`inline-flex items-center px-1.5 py-1 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] rounded-md border transition-colors whitespace-nowrap ${
                        c.key === active ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-blue-700 text-gray-700 hover:bg-gray-100"
                      }`}
                      aria-pressed={c.key === active}
                      aria-label={`${currentTop?.label} - ${c.label}`}
                      title={`${currentTop?.label} - ${c.label}`}
                    >
                      {c.Icon ? <c.Icon className="h-4 w-4 mr-2" /> : null}
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      <div className="w-full overflow-x-auto">
        <div role="tablist" aria-label="Categories" className="flex items-center gap-1 whitespace-nowrap pr-1 justify-center lg:justify-start">
          {topTabs.map((t) => {
            const isActiveTop = t.key === currentTopKey;
            return (
              <span key={t.key} className="inline-flex items-center gap-1 pb-0.5">
                <button
                  onClick={() => onChange(t.key)}
                  className={`px-4 py-2 text-sm font-bold rounded-md border md:shadow-md shadow-[0_-4px_15px_rgba(0,0,0,0.1)] transition-colors ${
                    isActiveTop ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                  role="tab"
                  aria-selected={isActiveTop}
                  title={t.label}
                >
                  {t.Icon ? <t.Icon className="h-4 w-4 mr-2 inline-block" /> : null}
                  {t.label}
                </button>
              </span>
            );
          })}
        </div>
      </div>

    <div className="hidden lg:block">
      {/* Breadcrumbs for deeper levels beyond the immediate children */}
      {breadcrumbs.length > 0 && (activeLevel > 2 || children.length > 0) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 p-2">
          <div className="flex items-center bg-white rounded-md shadow-md px-2">
            {breadcrumbs.map((node, idx) => ( //skip the first one
              <span key={node.key} className="flex items-center gap-1">
                <span className="text-gray-300 px-1">➤</span> 
                <button
                  onClick={() => {
                    const isActiveCrumb = node.key === active;
                    const parentKey = idx === 0 ? breadcrumbs[0]?.key : breadcrumbs[idx]?.key;
                    onChange(isActiveCrumb ? (parentKey ?? node.key) : node.key);
                  }}
                  className={`py-1 rounded hover:bg-gray-100 ${node.key === active ? 'text-blue-700 font-semibold' : ''}`}
                  title={node.label}
                >
                 {node.label}
                </button>
              </span>
            ))}
          </div>

          {/* Expanded children at the bottom-right, skip when 'All' is selected */}
          {currentTopKey !== 'all' && children.length > 0 && (
            <div className="flex items-center gap-1 justify-end">
              {children.map((c) => (
                <button
                  key={c.key}
                  onClick={() => onChange(c.key)}
                  className={`inline-flex items-center px-1.5 py-1 rounded-md shadow-md border transition-colors ${
                    c.key === active ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-blue-700 text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-pressed={c.key === active}
                  aria-label={`${currentTop?.label} - ${c.label}`}
                  title={`${currentTop?.label} - ${c.label}`}
                >
                  {c.Icon ? <c.Icon className="h-4 w-4 mr-2" /> : null}
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  );
}

export type { CategoryKey };

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
  selectedLeaves?: CategoryKey[];
  onSelectedLeavesChange?: (keys: CategoryKey[]) => void;
}

interface CategoryNode {
  key: CategoryKey;
  label: string;
  Icon?: React.ComponentType<{ className?: string }>;
  enabled?: boolean;
  children?: CategoryNode[];
}


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

export default function CategoryTabs({ active, onChange, compact = false, selectedLeaves, onSelectedLeavesChange }: CategoryTabsProps) {
  const [open, setOpen] = useState(false);
  const { categories: rawCategories } = useConfig();
  const categoryTree = useMemo(() => rawCategories ? transform(rawCategories as RawCategoryNode) : null, [rawCategories]);

  const effectiveActiveKey = useMemo(() => {
    const children = categoryTree?.children || [];
    if (children.length === 1 && (active === 'all' || !active)) {
      return children[0].key;
    }
    return active;
  }, [active, categoryTree]);

  const topTabs = useMemo(() => {
    const children = categoryTree?.children || [];
    // If there's only one child under root, hide all top-level tabs
    if (children.length === 1) {
      return [];
    }
    // Otherwise include "All" option
    return [{ key: 'all', label: 'All', Icon: Layers, enabled: true } as CategoryNode, ...children];
  }, [categoryTree]);

  const currentTopKey = useMemo(() => {
    return topLevelOf(effectiveActiveKey);
  }, [effectiveActiveKey]);

  const currentTop = useMemo(() => {
    if (topTabs.length > 0) {
      return topTabs.find(t => t.key === currentTopKey) || topTabs[0];
    }
    // When no top tabs (only one category), use that category as the current top
    return categoryTree?.children?.[0] || null;
  }, [topTabs, currentTopKey, categoryTree]);

  const activeNode = useMemo(() => categoryTree ? findNode(categoryTree, effectiveActiveKey) || currentTop : currentTop, [effectiveActiveKey, currentTop, categoryTree]);
  const breadcrumbs = useMemo(() => categoryTree ? getPath(categoryTree, effectiveActiveKey).slice(1) : [], [effectiveActiveKey, categoryTree]); // exclude virtual root
  const children = activeNode?.children || [];
  const activeLevel = useMemo(() => categoryTree ? getPath(categoryTree, effectiveActiveKey).length : 0, [effectiveActiveKey, categoryTree]);

  // Leaf-level multi-select helpers
  const isLeaf = (n: CategoryNode) => !n.children || n.children.length === 0;
  const isLeafChildren = children.length > 0 && children.every(isLeaf);
  const parentPrefix = activeNode?.key && activeNode.key !== 'all' ? `${activeNode.key}.` : '';
  const filteredSelectedLeaves = useMemo(() => {
    if (!Array.isArray(selectedLeaves) || !parentPrefix) return [] as CategoryKey[];
    return selectedLeaves.filter(k => typeof k === 'string' && k.startsWith(parentPrefix));
  }, [selectedLeaves, parentPrefix]);

  function toggleLeafSelection(key: CategoryKey) {
    if (!onSelectedLeavesChange) return;
    const exists = filteredSelectedLeaves.includes(key);
    if (exists) onSelectedLeavesChange(filteredSelectedLeaves.filter(k => k !== key));
    else onSelectedLeavesChange([...filteredSelectedLeaves, key]);
  }

  function selectAllLeaves() {
    if (!onSelectedLeavesChange) return;
    onSelectedLeavesChange(children.map(c => c.key) as CategoryKey[]);
  }

  function clearLeafSelection() {
    if (!onSelectedLeavesChange) return;
    onSelectedLeavesChange([]);
  }

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
          <span>{activeNode?.label || currentTop?.label || 'All'}</span>
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && topTabs.length > 0 && (
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
              ) : isLeafChildren && onSelectedLeavesChange ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <button onClick={() => selectAllLeaves()} className="text-xs text-blue-700 hover:underline">Select all</button>
                    <button onClick={() => clearLeafSelection()} className="text-xs text-gray-600 hover:underline">Clear</button>
                  </div>
                  {children.map(c => {
                    const checked = filteredSelectedLeaves.includes(c.key);
                    return (
                      <label key={c.key} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${checked ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>
                        <input type="checkbox" className="accent-blue-600" checked={checked} onChange={() => toggleLeafSelection(c.key)} />
                        <span className="flex-1 text-left">{c.label}</span>
                      </label>
                    );
                  })}
                  <div className="pt-1">
                    <button onClick={() => setOpen(false)} className="w-full text-center text-xs text-white bg-blue-600 hover:bg-blue-700 rounded px-2 py-1.5">Done</button>
                  </div>
                </div>
              ) : (
                children.map(c => (
                  <button key={c.key} onClick={() => { onChange(c.key); setOpen(false); }} className={`w-full text-left px-3 py-1.5 rounded ${c.key === effectiveActiveKey ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>{c.label}</button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show loading state when categories are not available yet
  if (!categoryTree) {
    return (
      <div className="w-full">
        <div className="lg:hidden">
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-100 transition-colors">
            <Layers className="h-4 w-4 mr-2" />
            <span>Loading...</span>
          </button>
        </div>
        <div className="w-full overflow-x-auto">
          <div role="tablist" aria-label="Categories" className="flex items-center gap-1 whitespace-nowrap pr-1 justify-center lg:justify-start">
            <button className="px-4 py-2 text-sm font-bold rounded-md border md:shadow-md shadow-[0_-4px_15px_rgba(0,0,0,0.1)] bg-gray-100 text-gray-400 cursor-not-allowed">
              <Layers className="h-4 w-4 mr-2 inline-block" />
              Loading...
            </button>
          </div>
        </div>
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
                    <span className="text-gray-300 text-lg px-1">➤</span> 
                    <button
                      onClick={() => {
                        const isActiveCrumb = node.key === active;
                        const parentKey = idx === 0 ? breadcrumbs[0]?.key : breadcrumbs[idx]?.key;
                        onChange(isActiveCrumb ? (parentKey ?? node.key) : node.key);
                      }}
                      className={`py-2 rounded hover:bg-gray-100 whitespace-nowrap ${node.key === effectiveActiveKey ? 'text-blue-700 font-semibold' : ''}`}
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
                  {isLeafChildren && onSelectedLeavesChange ? (
                    <>
                      {children.map((c) => {
                        const selected = filteredSelectedLeaves.includes(c.key);
                        return (
                          <button
                            key={c.key}
                            onClick={() => toggleLeafSelection(c.key)}
                            className={`inline-flex items-center px-1.5 py-2 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] rounded-md border transition-colors whitespace-nowrap ${
                              selected ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-blue-700 text-gray-700 hover:bg-gray-100"
                            }`}
                            aria-pressed={selected}
                            aria-label={`${currentTop?.label} - ${c.label}`}
                            title={`${currentTop?.label} - ${c.label}`}
                          >
                            {c.Icon ? <c.Icon className="h-4 w-4 mr-2" /> : null}
                            <span>{c.label}</span>
                          </button>
                        );
                      })}
                      <button onClick={selectAllLeaves} className="ml-2 text-xs text-blue-700 hover:underline">Select all</button>
                      <button onClick={clearLeafSelection} className="text-xs text-gray-600 hover:underline">Clear</button>
                    </>
                  ) : (
                    children.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => onChange(c.key)}
                        className={`inline-flex items-center px-1.5 py-2 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] rounded-md border transition-colors whitespace-nowrap ${
                          c.key === effectiveActiveKey ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-blue-700 text-gray-700 hover:bg-gray-100"
                        }`}
                        aria-pressed={c.key === effectiveActiveKey}
                        aria-label={`${currentTop?.label} - ${c.label}`}
                        title={`${currentTop?.label} - ${c.label}`}
                      >
                        {c.Icon ? <c.Icon className="h-4 w-4 mr-2" /> : null}
                        <span>{c.label}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      {topTabs.length > 0 && (
        <div className="w-full overflow-x-auto">
          <div role="tablist" aria-label="Categories" className="flex items-center gap-1 whitespace-nowrap pr-1 justify-center lg:justify-start">
            {topTabs.map((t) => {
              const isSelected = t.key === effectiveActiveKey;
              return (
                <span key={t.key} className="inline-flex items-center gap-1 pb-0.5">
                  <button
                    onClick={() => onChange(t.key)}
                  className={`px-4 py-2 text-sm font-bold rounded-md border md:shadow-md shadow-[0_-4px_15px_rgba(0,0,0,0.1)] transition-colors ${
                    isSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                    role="tab"
                    aria-selected={t.key === effectiveActiveKey}
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
      )}

    <div className="hidden lg:block">
      {/* Breadcrumbs for deeper levels beyond the immediate children */}
      {breadcrumbs.length > 0 && (activeLevel > 2 || children.length > 0) && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center bg-white rounded-md shadow-md px-2">
            {breadcrumbs.map((node, idx) => ( //skip the first one
              <span key={node.key} className="flex items-center gap-1">
                <span className="text-gray-300 text-lg px-1">➤</span> 
                <button
                  onClick={() => {
                    const isActiveCrumb = node.key === active;
                    const parentKey = idx === 0 ? breadcrumbs[0]?.key : breadcrumbs[idx]?.key;
                    onChange(isActiveCrumb ? (parentKey ?? node.key) : node.key);
                  }}
                  className={`py-2 rounded hover:bg-gray-100 ${node.key === effectiveActiveKey ? 'text-blue-700 font-semibold' : ''}`}
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
              {isLeafChildren && onSelectedLeavesChange ? (
                <>
                  {children.map((c) => {
                    const selected = filteredSelectedLeaves.includes(c.key);
                    return (
                      <button
                        key={c.key}
                        onClick={() => toggleLeafSelection(c.key)}
                        className={`inline-flex items-center px-1.5 py-2 rounded-md shadow-md border transition-colors whitespace-nowrap ${
                          selected ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-blue-700 text-gray-700 hover:bg-gray-100"
                        }`}
                        aria-pressed={selected}
                        aria-label={`${currentTop?.label} - ${c.label}`}
                        title={`${currentTop?.label} - ${c.label}`}
                      >
                        {c.Icon ? <c.Icon className="h-4 w-4 mr-2" /> : null}
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                  <button onClick={selectAllLeaves} className="ml-2 text-xs text-blue-700 hover:underline">Select all</button>
                  <button onClick={clearLeafSelection} className="text-xs text-gray-600 hover:underline">Clear</button>
                </>
              ) : (
                children.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => onChange(c.key)}
                    className={`inline-flex items-center px-1.5 py-2 rounded-md shadow-md border transition-colors whitespace-nowrap ${
                      c.key === effectiveActiveKey ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-blue-700 text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-pressed={c.key === effectiveActiveKey}
                    aria-label={`${currentTop?.label} - ${c.label}`}
                    title={`${currentTop?.label} - ${c.label}`}
                  >
                    {c.Icon ? <c.Icon className="h-4 w-4 mr-2" /> : null}
                    <span>{c.label}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  );
}

export type { CategoryKey };

"use client";
import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronRight, ChevronDown, FolderOpen, Tag } from 'lucide-react';
import type { CategoryKey } from './CategoryTabs';
import Modal from '@/components/Modal';

interface CategoryNode {
  key: string;
  label: string;
  icon?: string;
  enabled?: boolean;
  createEnabled?: boolean;
  children?: CategoryNode[];
}

export default function CreateAdSelectorModal({ open, onCancel, onSelect, defaultCategory }: { open: boolean, onCancel: () => void, onSelect: (key: CategoryKey) => void, defaultCategory?: CategoryKey }) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard handling and scroll locking are handled by core Modal

  useEffect(() => {
    if (!open) return;

    function buildKeySetTo(defaultKey?: string, tree?: CategoryNode): Set<string> {
      const keys = new Set<string>();
      if (!defaultKey || !tree) return keys;

      const target = defaultKey.trim();
      if (!target || target === 'all') return keys;

      // DFS to find path to target and collect keys along that path (excluding 'all')
      const path: string[] = [];
      let found = false;
      function dfs(node: CategoryNode): boolean {
        path.push(node.key);
        if (node.key === target) { found = true; return true; }
        if (node.children) {
          for (const child of node.children) {
            if (dfs(child)) return true;
          }
        }
        path.pop();
        return false;
      }
      if (dfs({ key: 'all', label: 'All', children: tree.children } as CategoryNode) && found) {
        for (const k of path) {
          if (k !== 'all') keys.add(k);
        }
      }
      return keys;
    }

    (async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) return;
        const root = (await res.json()) as CategoryNode;
        const topLevelCategories = root.children || [];
        setCategories(topLevelCategories);

        // Expand to match the currently selected hierarchy if provided
        const initialExpanded = buildKeySetTo(defaultCategory, root);
        if (initialExpanded.size > 0) {
          setExpandedNodes(initialExpanded);
        } else if (topLevelCategories.length === 1) {
          setExpandedNodes(new Set([topLevelCategories[0].key]));
        } else {
          setExpandedNodes(new Set());
        }
      } catch {}
    })();
  }, [open, defaultCategory]);

  const toggleExpanded = (key: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const renderCategoryTree = (node: CategoryNode, level: number = 0): React.ReactNode | null => {
    if (!node.enabled) return null;
    
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.key);
    const isSelectable = node.createEnabled || (!hasChildren && node.key !== 'all');
    const indent = level * 20;
    const isSelected = node.key === defaultCategory;

    const handleClick = () => {
      if (hasChildren && !isSelectable) {
        toggleExpanded(node.key);
      } else if (isSelectable) {
        onSelect(node.key as CategoryKey);
      }
    };

    const handleExpandToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleExpanded(node.key);
    };

    return (
      <div key={node.key} className="select-none">
        <div 
          className={`group flex items-center transition-all duration-150 cursor-pointer
            ${isSelected 
              ? 'bg-blue-50 border-l-4 border-blue-500' 
              : 'hover:bg-gray-50 border-l-4 border-transparent'
            }
            ${isSelectable ? 'hover:bg-blue-50' : ''}
            min-h-[44px] sm:min-h-[40px]
          `}
          style={{ paddingLeft: `${16 + indent}px` }}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          {hasChildren && (
            <button 
              className="mr-2 p-1 rounded hover:bg-gray-200 transition-colors"
              onClick={handleExpandToggle}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
          
          {!hasChildren && (
            <div className="mr-2 p-1">
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
          )}
          
          {hasChildren && (
            <div className="mr-3">
              <FolderOpen className={`h-4 w-4 ${isExpanded ? 'text-blue-500' : 'text-gray-500'}`} />
            </div>
          )}
          
          <span className={`flex-1 text-left py-2 pr-2 transition-colors
            ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-900'}
            ${isSelectable ? 'font-medium' : 'font-normal'}
            ${level === 0 ? 'text-base' : level === 1 ? 'text-sm' : 'text-xs'}
          `}>
            {node.label}
          </span>
          
          {isSelectable && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all
              ${isSelected 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-green-100 text-green-700 group-hover:bg-green-200'
              }
            `}>
              Create
            </div>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="bg-gray-25">
            {node.children!.map(child => renderCategoryTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onCancel} zIndexClass="z-[1150]" backdropClassName="absolute inset-0 bg-black/60 backdrop-blur-sm" containerClassName="absolute inset-0 flex items-center justify-center p-2 lg:p-4" title="Choose Category">
      <div 
        ref={modalRef}
        className="bg-white w-full md:min-w-md lg:min-w-lg xl:min-w-2xl max-w-2xl rounded-2xl
                   overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col transform transition-all duration-300 ease-out"
      >

        {/* Categories list with improved scrolling */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="divide-y divide-gray-100 pr-8">
            {categories.map(category => renderCategoryTree(category))}
          </div>
        </div>

      </div>
    </Modal>
  );
}

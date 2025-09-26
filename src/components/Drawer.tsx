"use client";
import { X } from 'lucide-react';
import { useEffect } from 'react';
import Image from 'next/image';

export default function Drawer({ open, onClose, children, width = 320 }: { open: boolean; onClose: () => void; children: React.ReactNode; width?: number; }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);
  return (
    <div className={`fixed inset-0 z-[1200] pointer-events-none ${open ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 pointer-events-auto" style={{ width }}>
        <div className="h-full w-full bg-white shadow-2xl border-r flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            
            {/* Header with Logo */}
            <div className="flex items-center space-x-3">
              <Image 
                src="/sellonmap-logo.svg" 
                alt="SellOnMap" 
                width={64} 
                height={24} 
                className="flex-shrink-0 ml-[-8px]"
              />
              <div>
                <h2 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  SellOnMap
                </h2>
                <p className="text-xs text-gray-500">Sell anything, anywhere</p>
              </div>
            </div>
            <button aria-label="Close" onClick={onClose} className="p-2 rounded hover:bg-gray-100 text-gray-700"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

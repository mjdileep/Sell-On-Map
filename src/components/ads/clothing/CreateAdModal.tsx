"use client";

import { useState, useEffect } from "react";
import { X, Shirt, Text, Loader2 } from "lucide-react";
import { useAuthModal } from "@/app/providers";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import Modal from "@/components/Modal";

export interface ClothingCreateAdModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function ClothingCreateAdModal({ open, onClose, onCreated }: ClothingCreateAdModalProps) {
  const { openAuthModal } = useAuthModal();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'details' | 'images'>('details');
  const [createdAdId, setCreatedAdId] = useState<string | undefined>(undefined);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          address: 'Colombo',
          lat: 6.9271,
          lng: 79.8612,
          category: 'clothing',
        }),
      });
      if (response.status === 401) { openAuthModal({ reason: 'Sign In First', callbackUrl: '/?create=1&category=clothing' }); return; }
      if (response.ok) { const created = await response.json(); setCreatedAdId(String(created.id)); setStep('images'); }
    } finally {
      setSubmitting(false);
    }
  };

  async function finishCreation() {
    if (!createdAdId) { onClose(); return; }
    setSubmitting(true);
    try {
      await fetch(`/api/ads/${createdAdId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photos }) });
      onCreated?.();
      onClose();
      router.push('/me/listings');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose() {
    if (createdAdId && photos.length === 0) {
      try { await fetch(`/api/ads/${createdAdId}`, { method: 'DELETE' }); } catch {}
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 truncate">Create Clothing Ad</h2>
          <button aria-label="Close" onClick={handleClose} className="p-2 rounded hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">
            {step === 'details' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <div className="relative">
                  <Text className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Men's casual shirt..." required />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pl-3" placeholder="Details..." required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <div className="relative">
                  <Shirt className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="25" required />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center disabled:bg-blue-400">
                  {submitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                  {submitting ? 'Submitting...' : 'Continue to Photos'}
                </button>
              </div>
            </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
                  <ImageUploader adId={createdAdId} value={photos} onChange={setPhotos} />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button type="button" onClick={() => setStep('details')} className="w-full border text-gray-700 font-semibold py-3 px-4 rounded-md">Back</button>
                  <button type="button" onClick={finishCreation} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center disabled:bg-blue-400">
                    {submitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                    {submitting ? 'Saving...' : 'Finish'}
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
}



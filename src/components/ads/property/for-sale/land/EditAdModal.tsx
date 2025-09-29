"use client";

import { useEffect, useMemo, useState } from "react";
import { Text, Loader2, Banknote, Square, Map, TreePine, Zap, Mountain } from "lucide-react";
import { useAuthModal } from "@/app/providers";
import { useRouter } from "next/navigation";
import { useConfig } from "@/app/config-context";
import { monetary_units_flags } from "@/lib/currencyUtils";
import Modal from "@/components/Modal";
import LocationFields from "@/components/ads/shared/LocationFields";
import ContactInfoSection from "@/components/ads/shared/ContactInfoSection";
import CreateAdImageSection from "@/components/ads/shared/CreateAdImageSection";

function deriveType(category?: string): 'residential' | 'commercial' | 'industrial' | 'agricultural' | '' {
  const c = (category || '').toLowerCase();
  if (c.includes('.residential')) return 'residential';
  if (c.includes('.commercial')) return 'commercial';
  if (c.includes('.industrial')) return 'industrial';
  if (c.includes('.agricultural')) return 'agricultural';
  return '';
}

export default function LandSaleEditAdModal({ open, onClose, adId, onSaved }: { open: boolean; onClose: () => void; adId: string; onSaved?: () => void }) {
  const { openAuthModal } = useAuthModal();
  const router = useRouter();
  const { currency: defaultCurrency } = useConfig();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currency, setCurrency] = useState<string>(defaultCurrency || 'USD');
  const [category, setCategory] = useState<string>("");
  const type = useMemo(() => deriveType(category), [category]);

  const [sizeValue, setSizeValue] = useState("");
  const [sizeUnit, setSizeUnit] = useState<'perch' | 'acre' | 'hect' | 'sqft' | ''>('perch');
  const [zoning, setZoning] = useState("");
  const [development, setDevelopment] = useState("");
  const [accessUtilities, setAccessUtilities] = useState("");
  const [topography, setTopography] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !adId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ads/${adId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const ad = await res.json();
        setTitle(String(ad.title || ''));
        setDescription(String(ad.description || ''));
        setPrice(String(ad.price ?? ''));
        setCurrency(String(ad.currency || defaultCurrency || 'USD'));
        setAddress(String(ad.address || ''));
        setLocation(ad.lat && ad.lng ? { lat: Number(ad.lat), lng: Number(ad.lng) } : null);
        setCategory(String(ad.category || ''));
        setPhotos(Array.isArray(ad.photos) ? ad.photos : []);

        const details = ad.details || {};
        setSizeValue(String(details?.size?.value || ''));
        setSizeUnit((details?.size?.unit as any) || 'perch');
        setZoning(String(details?.usage?.zoning || ''));
        setDevelopment(String(details?.extras?.developmentPotential || ''));
        setAccessUtilities(String(details?.extras?.accessUtilities || ''));
        setTopography(String(details?.extras?.topographyAmenities || ''));
        setContactPhone(String(details?.extras?.contact?.phone || ''));
        setContactWhatsapp(String(details?.extras?.contact?.whatsapp || ''));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, adId, defaultCurrency]);

  async function save(event: React.FormEvent) {
    event.preventDefault();

    // Validate location is selected
    if (!address.trim() || !location) {
      alert('Please enter an address and select a location on the map');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/ads/${adId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          currency,
          address,
          lat: location.lat,
          lng: location.lng,
          photos,
          details: {
            type,
            size: { value: Number(sizeValue), unit: sizeUnit },
            location: { address },
            usage: { zoning },
            extras: {
              developmentPotential: development,
              accessUtilities: accessUtilities || undefined,
              topographyAmenities: topography || undefined,
              contact: { phone: contactPhone, whatsapp: contactWhatsapp || undefined },
            },
          },
        }),
      });
      if (response.status === 401) { openAuthModal({ reason: 'Sign In First', callbackUrl: `/me/listings` }); return; }
      if (response.ok) {
        onSaved?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Land Sale Ad">
      <div className="bg-white w-full max-w-5xl rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex-1 overflow-y-auto p-1 lg:p-4">
          <form onSubmit={save} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-xl p-4 md:p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Text className="h-5 w-5 text-indigo-600" />
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <div className="relative">
                    <Text className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Prime agricultural land..." required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none" placeholder="Detailed description of your land..." required />
                </div>

                {type ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Land Type</label>
                    <div className="flex items-center gap-2 w-full px-4 py-3 border border-gray-200 rounded-lg bg-indigo-50 text-indigo-800">
                      <TreePine className="h-4 w-4" />
                      {type[0].toUpperCase() + type.slice(1)}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Pricing & Location */}
            <div className="bg-green-50 rounded-xl p-4 md:p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Banknote className="h-5 w-5 text-green-600" />
                Pricing & Location
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Price</label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <div className="flex">
                      <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="flex-1 w-full pl-10 pr-2 py-3 border border-gray-200 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="150000" required />
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-20 px-3 py-3 border-l-0 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white">
                        {Object.keys(monetary_units_flags).map((code) => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <LocationFields
                  address={address}
                  onAddressChange={setAddress}
                  location={location}
                  onLocationChange={setLocation}
                  placeholder="123 Main Street, City"
                  overideZoom={15}
                  editMode
                />
              </div>
            </div>

            {/* Land Details */}
            <div className="bg-blue-50 rounded-xl p-4 md:p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Square className="h-5 w-5 text-blue-600" />
                Land Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="justify-between">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Square className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={sizeValue} onChange={(e) => setSizeValue(e.target.value)} type="number" required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="13.3" />
                      </div>
                      <div>
                        <select value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value as any)} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white">
                          <option value="">Select</option>
                          <option value="hect">Hectares</option>
                          <option value="acre">Acres</option>
                          <option value="perch">Perches</option>
                          <option value="sqft">Square Feet</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zoning (optional)</label>
                    <div className="relative">
                      <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input value={zoning} onChange={(e) => setZoning(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="R-1 / C-3 / AG" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Development Potential</label>
                  <div className="relative">
                    <TreePine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={development} onChange={(e) => setDevelopment(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Subdividable, ready for development" />
                  </div>
                </div>
              </div>
            </div>

            {/* Utilities & Features */}
            <div className="bg-yellow-50 rounded-xl p-4 md:p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Zap className="h-5 w-5 text-yellow-600" />
                Utilities & Features <span className="text-sm font-normal text-gray-500">(optional)</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access/Utilities</label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={accessUtilities} onChange={(e) => setAccessUtilities(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Road access, water rights, electricity available" />
                  </div>
                </div>
                <div>
                  <label className="block text sm font-medium text-gray-700 mb-2">Topography/Amenities</label>
                  <div className="relative">
                    <Mountain className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={topography} onChange={(e) => setTopography(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Flat terrain, fertile soil, scenic views" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <ContactInfoSection
              phone={contactPhone}
              whatsapp={contactWhatsapp}
              onPhoneChange={setContactPhone}
              onWhatsappChange={setContactWhatsapp}
              phonePlaceholder="+94 11 123 4567"
            />

            {/* Images on same view */}
            <div className="space-y-4">
              <CreateAdImageSection
                adId={adId}
                photos={photos}
                onChange={setPhotos}
                title="Land Photos"
                helpText="Showcase your land with high-quality photos to attract potential buyers."
                icon={<TreePine className="h-5 w-5 text-indigo-600" />}
              />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={saving || loading} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl">
                {(saving || loading) ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                {(saving || loading) ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}



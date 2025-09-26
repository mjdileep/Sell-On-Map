"use client";

import { useEffect, useState } from "react";
import { Text, Loader2, Banknote, TreePine, Calendar, Square, Map, Clock, Zap, Mountain } from "lucide-react";
import { useAuthModal } from "@/app/providers";
import { useRouter } from "next/navigation";
import { useConfig } from "@/app/config-context";
import { monetary_units_flags } from "@/lib/currencyUtils";
import Modal from "@/components/Modal";
import LocationFields from "@/components/ads/shared/LocationFields";
import ContactInfoSection from "@/components/ads/shared/ContactInfoSection";
import CreateAdImageSection from "@/components/ads/shared/CreateAdImageSection";

export default function RentalLandCreateAdModal({ open, onClose, onCreated, category }: { open: boolean; onClose: () => void; onCreated?: () => void; category?: string }) {
  const { openAuthModal } = useAuthModal();
  const router = useRouter();
  const { currency: defaultCurrency } = useConfig();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'details' | 'images'>('details');
  const [createdAdId, setCreatedAdId] = useState<string | undefined>(undefined);
  const [photos, setPhotos] = useState<string[]>([]);

  // Details per template
  const deriveType = (cat?: string): 'commercial' | 'industrial' | 'agricultural' | '' => {
    const c = (cat || '').toLowerCase();
    if (c.includes('.commercial')) return 'commercial';
    if (c.includes('.industrial')) return 'industrial';
    if (c.includes('.agricultural')) return 'agricultural';
    return '';
  };
  const [type] = useState<'commercial' | 'industrial' | 'agricultural' | ''>(deriveType(category));
  const [currency, setCurrency] = useState<string>(defaultCurrency || 'USD');
  const [billingPeriod, setBillingPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [sizeValue, setSizeValue] = useState("");
  const [sizeUnit, setSizeUnit] = useState<'hect' | 'acre' | 'perch' | 'sqft' | ''>('perch');
  const [zoning, setZoning] = useState("");
  const [advanceNum, setAdvanceNum] = useState("");
  const [advanceUnit, setAdvanceUnit] = useState<'days' | 'months' | 'years' | ''>('months');
  const [minLeaseValue, setMinLeaseValue] = useState("");
  const [minLeaseUnit, setMinLeaseUnit] = useState<'months' | 'years' | ''>('months');
  const [maxLeaseValue, setMaxLeaseValue] = useState("");
  const [maxLeaseUnit, setMaxLeaseUnit] = useState<'months' | 'years' | ''>('months');
  const [accessUtilities, setAccessUtilities] = useState("");
  const [restrictionsAmenities, setRestrictionsAmenities] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");

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
          currency,
          address,
          lat: location?.lat || 0,
          lng: location?.lng || 0,
          category: category || ('property.rental.land.' + type),
          details: {
            type,
            billingPeriod,
            size: { value: Number(sizeValue), unit: sizeUnit },
            location: { address },
            usage: { zoning },
            leaseTerms: {
              advancePayment: advanceNum ? { value: Number(advanceNum), unit: advanceUnit } : undefined,
              minLeaseDuration: minLeaseValue ? { value: Number(minLeaseValue), unit: minLeaseUnit } : undefined,
              maxLeaseDuration: maxLeaseValue ? { value: Number(maxLeaseValue), unit: maxLeaseUnit } : undefined,
            },
            extras: { accessUtilities: accessUtilities || undefined, restrictionsAmenities: restrictionsAmenities || undefined, contact: { phone: contactPhone, whatsapp: contactWhatsapp || undefined } },
          },
        }),
      });
      if (response.status === 401) { openAuthModal({ reason: 'Sign In First', callbackUrl: '/?create=1&category=property.rental.land' }); return; }
      if (response.ok) {
        const created = await response.json();
        setCreatedAdId(String(created.id));
        setStep('images');
      }
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
    <Modal open={open} onClose={handleClose} title="Create Land Rental Ad">
      <div className="bg-white w-full max-w-5xl rounded-2xl overflow-hidden max-h-[85vh]  flex flex-col">
       
        <div className="flex-1 overflow-y-auto p-1 lg:p-4">
            {step === 'details' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Commercial land for lease..." required />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none" placeholder="Detailed description of your land rental..." required />
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rental Price</label>
                        <div className="relative">
                          <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <div className="flex">
                          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="flex-1 w-full pl-10 pr-2 py-3 border border-gray-200 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="50000" required />
                          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-20 px-3 py-3 border-l-0 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white">
                            {Object.keys(monetary_units_flags).map((code) => (
                              <option key={code} value={code}>{code}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Billing Period</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value as any)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white appearance-none">
                          <option value="day">Per Day</option>
                          <option value="month">Per Month</option>
                          <option value="year">Per Year</option>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zoning/Permitted Use (optional)</label>
                      <div className="relative">
                        <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={zoning} onChange={(e) => setZoning(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="C-2 / M-1 / AG-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lease Terms */}
              <div className="bg-purple-50 rounded-xl p-4 md:p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Lease Terms
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Advance Payment</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={advanceNum} onChange={(e) => setAdvanceNum(e.target.value)} type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="3" />
                      <select value={advanceUnit} onChange={(e) => setAdvanceUnit(e.target.value as any)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white">
                        <option value="">Unit</option>
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Lease Duration</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={minLeaseValue} onChange={(e) => setMinLeaseValue(e.target.value)} type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="3" />
                      <select value={minLeaseUnit} onChange={(e) => setMinLeaseUnit(e.target.value as any)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white">
                        <option value="">Unit</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Lease Duration</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={maxLeaseValue} onChange={(e) => setMaxLeaseValue(e.target.value)} type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="60" />
                      <select value={maxLeaseUnit} onChange={(e) => setMaxLeaseUnit(e.target.value as any)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white">
                        <option value="">Unit</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
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
                      <input value={accessUtilities} onChange={(e) => setAccessUtilities(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Paved frontage, irrigation, power lines" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Restrictions/Amenities</label>
                    <div className="relative">
                      <Mountain className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input value={restrictionsAmenities} onChange={(e) => setRestrictionsAmenities(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="No subletting, soil test available" />
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
              />

              <div className="pt-4">
                <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl">
                  {submitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                  {submitting ? 'Creating Ad...' : 'Continue to Photos'}
                </button>
              </div>
            </form>
            ) : (
              <div className="space-y-6">
                <CreateAdImageSection
                  adId={createdAdId}
                  photos={photos}
                  onChange={setPhotos}
                  title="Land Photos"
                  helpText="Add photos to showcase your land rental and attract quality tenants."
                  icon={<TreePine className="h-5 w-5 text-indigo-600" />}
                />
                <div className="grid grid-cols-1">
                  <button type="button" onClick={finishCreation} disabled={submitting} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl">
                    {submitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                    {submitting ? 'Publishing...' : 'Publish Ad'}
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
}

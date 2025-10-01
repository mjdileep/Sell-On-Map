"use client";

import { useEffect, useState } from "react";
import { X, BadgeDollarSign, Text, Loader2, Banknote, Building2, Calendar, Layers, Square, Wrench, Car, Clock, Shield, Bed, Bath, User } from "lucide-react";
import { useAuthModal } from "@/app/providers";
import { useRouter } from "next/navigation";
import { useConfig } from "@/app/config-context";
import { monetary_units_flags } from "@/lib/currencyUtils";
import Modal from "@/components/Modal";
import LocationFields from "@/components/ads/shared/LocationFields";
import ContactInfoSection from "@/components/ads/shared/ContactInfoSection";
import CreateAdImageSection from "@/components/ads/shared/CreateAdImageSection";

export default function RentalBuildingCreateAdModal({ open, onClose, onCreated, category }: { open: boolean; onClose: () => void; onCreated?: () => void; category?: string }) {
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

  // Details
  const deriveType = (cat?: string): 'private-apartment' | 'private-house' | 'private-annex' | 'private-room' | 'shared-room' | 'shared-hostel' | 'office' | 'retail' | 'warehouse' | 'manufacturing' | 'mixed-use' | 'hospitality' | '' => {
    const c = (cat || '').toLowerCase();
    if (c.includes('.residential.private-apartment')) return 'private-apartment';
    if (c.includes('.residential.private-house')) return 'private-house';
    if (c.includes('.residential.private-annex')) return 'private-annex';
    if (c.includes('.residential.private-room')) return 'private-room';
    if (c.includes('.residential.shared-room')) return 'shared-room';
    if (c.includes('.residential.shared-hostel')) return 'shared-hostel';
    if (c.includes('.commercial.office')) return 'office';
    if (c.includes('.commercial.retail')) return 'retail';
    if (c.includes('.industrial.warehouse')) return 'warehouse';
    if (c.includes('.industrial.manufacturing')) return 'manufacturing';
    if (c.includes('.mixed-use')) return 'mixed-use';
    if (c.includes('.hospitality')) return 'hospitality';
    return '';
  };
  const [type] = useState<'private-apartment' | 'private-house' | 'private-annex' | 'private-room' | 'shared-room' | 'shared-hostel' | 'office' | 'retail' | 'warehouse' | 'manufacturing' | 'mixed-use' | 'hospitality' | ''>(deriveType(category));
  const [currency, setCurrency] = useState<string>(defaultCurrency || 'USD');
  const [billingPeriod, setBillingPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [floorAreaValue, setFloorAreaValue] = useState("");
  const [floorAreaUnit, setFloorAreaUnit] = useState<'sqft' | 'sqm' | ''>('sqft');
  const [landSizeValue, setLandSizeValue] = useState("");
  const [landSizeUnit, setLandSizeUnit] = useState<'hect' | 'acre' | 'perch' | ''>('perch');
  const [floors, setFloors] = useState("");
  const [buildYear, setBuildYear] = useState("");
  const [condition, setCondition] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [zoning, setZoning] = useState("");
  const [parking, setParking] = useState("");
  const [advanceNum, setAdvanceNum] = useState("");
  const [advanceUnit, setAdvanceUnit] = useState<'days' | 'months' | 'years' | ''>('months');
  const [minLeaseValue, setMinLeaseValue] = useState("");
  const [minLeaseUnit, setMinLeaseUnit] = useState<'months' | 'years' | ''>('months');
  const [maxLeaseValue, setMaxLeaseValue] = useState("");
  const [maxLeaseUnit, setMaxLeaseUnit] = useState<'months' | 'years' | ''>('months');
  const [amenitiesUtilities, setAmenitiesUtilities] = useState("");
  const [leaseType, setLeaseType] = useState<'NNN' | 'Gross' | ''>('');
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [beds, setBeds] = useState("");

  const isSharedResidential = Boolean((category || '').toLowerCase().includes('property.rental.building.residential.shared'));
  const isPrivateResidential = Boolean((category || '').toLowerCase().includes('property.rental.building.residential.private'));
  const [preferredGender, setPreferredGender] = useState<'any' | 'male' | 'female' | ''>(isPrivateResidential ? 'any' : '');

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

    // Validate location is selected
    if (!address.trim() || !location) {
      alert('Please enter an address and select a location on the map');
      return;
    }

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
          lat: location?.lat,
          lng: location?.lng,
          category: category || ('property.rental.building.' + type),
          details: {
            type,
            billingPeriod,
            floorArea: { value: Number(floorAreaValue), unit: floorAreaUnit },
            landSize: landSizeValue ? { value: Number(landSizeValue), unit: landSizeUnit } : undefined,
            preferredGender: preferredGender || undefined,
            structure: { floors: floors ? Number(floors) : undefined, buildYear: buildYear ? Number(buildYear) : undefined, condition },
            rooms: { bedrooms: bedrooms ? Number(bedrooms) : undefined, bathrooms: bathrooms ? Number(bathrooms) : undefined, beds: (isSharedResidential || isPrivateResidential) && beds ? Number(beds) : undefined },
            usage: { zoning },
            parking,
            leaseTerms: {
              advancePayment: advanceNum ? { value: Number(advanceNum), unit: advanceUnit } : undefined,
              minLeaseDuration: minLeaseValue ? { value: Number(minLeaseValue), unit: minLeaseUnit } : undefined,
              maxLeaseDuration: maxLeaseValue ? { value: Number(maxLeaseValue), unit: maxLeaseUnit } : undefined,
            },
            extras: { amenitiesUtilities: amenitiesUtilities || undefined, leaseType: leaseType || undefined, contact: { phone: contactPhone, whatsapp: contactWhatsapp || undefined } },
          },
        }),
      });
      if (response.status === 401) { openAuthModal({ reason: 'Sign In First', callbackUrl: '/?create=1&category=property.rental.building' }); return; }
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
    <Modal open={open} onClose={handleClose} title="Create Building Rental Ad">
      <div className="bg-white w-full max-w-5xl rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
        
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
                      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Modern office building for rent..." required />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none" placeholder="Detailed description of your rental property..." required />
                  </div>

                  {type ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                      <div className="flex items-center gap-2 w-full px-4 py-3 border border-gray-200 rounded-lg bg-indigo-50 text-indigo-800">
                        <Building2 className="h-4 w-4" />
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">{isSharedResidential ? 'Price (per person per month)' : 'Rental Price'}</label>
                      <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <div className="flex">
                          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="flex-1 w-full pl-10 pr-2 py-3 border border-gray-200 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="100000" required />
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

              {/* Property Details */}
              <div className="bg-blue-50 rounded-xl p-4 md:p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                  <Square className="h-5 w-5 text-blue-600" />
                  Property Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Floor Area</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <Square className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={floorAreaValue} onChange={(e) => setFloorAreaValue(e.target.value)} type="number" required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="1440" />
                        </div>
                        <select value={floorAreaUnit} onChange={(e) => setFloorAreaUnit(e.target.value as any)} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white">
                          <option value="">Unit</option>
                          <option value="sqft">sq ft</option>
                          <option value="sqm">sq m</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Land Size <span className="text-gray-500">(optional)</span></label>
                      <div className="grid grid-cols-2 gap-3">
                        <input value={landSizeValue} onChange={(e) => setLandSizeValue(e.target.value)} type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="13.3" />
                        <select value={landSizeUnit} onChange={(e) => setLandSizeUnit(e.target.value as any)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white">
                          <option value="">Unit</option>
                          <option value="hect">Hectares</option>
                          <option value="acre">Acres</option>
                          <option value="perch">Perches</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Floors</label>
                      <div className="relative">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={floors} onChange={(e) => setFloors(e.target.value)} type="number" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="3" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Build Year</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={buildYear} onChange={(e) => setBuildYear(e.target.value)} type="number" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="2015" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                      <div className="relative">
                        <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Excellent" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-indigo-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                        <div className="relative">
                          <Bed className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} type="number" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="2" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                        <div className="relative">
                          <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} type="number" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="1" />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">{isSharedResidential ? 'Beds available (vacant)' : 'Beds (optional)'}</label>
                        <div className="relative">
                          <Bed className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={beds} onChange={(e) => setBeds(e.target.value)} type="number" required={isSharedResidential} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder={isSharedResidential ? 'Number of vacant beds' : 'Total beds'} />
                        </div>
                      </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select value={preferredGender} onChange={(e) => setPreferredGender(e.target.value as any)} required={isSharedResidential} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white appearance-none">
                        <option value="">Select</option>
                        <option value="any">Any</option>
                        <option value="male">Male Only</option>
                        <option value="female">Female Only</option>
                      </select>
                    </div>
                  </div>
                    </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zoning (optional)</label>
                      <input value={zoning} onChange={(e) => setZoning(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="R-2 / O-1 / WH" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Parking</label>
                      <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={parking} onChange={(e) => setParking(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="2-Car Garage" />
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
                      <input value={minLeaseValue} onChange={(e) => setMinLeaseValue(e.target.value)} type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="6" />
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

              {/* Additional Details */}
              <div className="bg-yellow-50 rounded-xl p-4 md:p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                  <Wrench className="h-5 w-5 text-yellow-600" />
                  Additional Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amenities/Utilities</label>
                    <input value={amenitiesUtilities} onChange={(e) => setAmenitiesUtilities(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="WiFi included, loading docks, HVAC" />
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
                  title="Property Photos"
                  helpText="Add photos to showcase your rental property and attract quality tenants."
                  icon={<Building2 className="h-5 w-5 text-indigo-600" />}
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



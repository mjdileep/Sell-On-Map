"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Text, Loader2, Banknote, Calendar, Wrench, Car, Square, Map, Bed, Bath, Layers } from "lucide-react";
import { useConfig } from "@/app/config-context";
import { monetary_units_flags } from "@/lib/currencyUtils";
import { useAuthModal } from "@/app/providers";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import LocationFields from "@/components/ads/shared/LocationFields";
import ContactInfoSection from "@/components/ads/shared/ContactInfoSection";
import CreateAdImageSection from "@/components/ads/shared/CreateAdImageSection";

type AreaUnit = 'sqft' | 'sqm' | '';
type LandUnit = 'hect' | 'acre' | 'perch' | '';
type BuildingSaleType = 'single-family' | 'multi-family' | 'condo-townhouse' | 'office' | 'retail' | 'warehouse' | 'manufacturing' | 'mixed-use' | 'hospitality' | '';

function deriveType(category?: string): BuildingSaleType | '' {
  const c = (category || '').toLowerCase();
  if (c.includes('.residential.single-family')) return 'single-family';
  if (c.includes('.residential.multi-family')) return 'multi-family';
  if (c.includes('.residential.condo-townhouse')) return 'condo-townhouse';
  if (c.includes('.commercial.office')) return 'office';
  if (c.includes('.commercial.retail')) return 'retail';
  if (c.includes('.industrial.warehouse')) return 'warehouse';
  if (c.includes('.industrial.manufacturing')) return 'manufacturing';
  if (c.includes('.mixed-use')) return 'mixed-use';
  if (c.includes('.hospitality')) return 'hospitality';
  return '';
}

export default function BuildingSaleEditAdModal({ open, onClose, adId, onSaved }: { open: boolean; onClose: () => void; adId: string; onSaved?: () => void }) {
  const { openAuthModal } = useAuthModal();
  const router = useRouter();
  const { currency: defaultCurrency } = useConfig();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState({ lat: 6.9271, lng: 79.8612 });
  const [currency, setCurrency] = useState<string>(defaultCurrency || 'USD');
  const [category, setCategory] = useState<string>("");
  const type = useMemo(() => deriveType(category), [category]);
  const isResidentialCategory = useMemo(() => (category || '').toLowerCase().includes('.residential'), [category]);

  const [floorAreaValue, setFloorAreaValue] = useState("");
  const [floorAreaUnit, setFloorAreaUnit] = useState<AreaUnit>('sqft');
  const [landSizeValue, setLandSizeValue] = useState("");
  const [landSizeUnit, setLandSizeUnit] = useState<LandUnit>('perch');
  const [floors, setFloors] = useState("");
  const [buildYear, setBuildYear] = useState("");
  const [condition, setCondition] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [zoning, setZoning] = useState("");
  const [parking, setParking] = useState("");
  const [amenitiesUtilities, setAmenitiesUtilities] = useState("");
  const [hoa, setHoa] = useState("");
  const [taxes, setTaxes] = useState("");
  const [investment, setInvestment] = useState("");
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
        setLocation({ lat: Number(ad.lat || 6.9271), lng: Number(ad.lng || 79.8612) });
        setCategory(String(ad.category || ''));
        setPhotos(Array.isArray(ad.photos) ? ad.photos : []);

        const details = ad.details || {};
        setFloorAreaValue(String(details?.floorArea?.value || ''));
        setFloorAreaUnit((details?.floorArea?.unit as any) || 'sqft');
        setLandSizeValue(String(details?.landSize?.value || ''));
        setLandSizeUnit((details?.landSize?.unit as any) || 'perch');
        setFloors(String(details?.structure?.floors || ''));
        setBuildYear(String(details?.structure?.buildYear || ''));
        setCondition(String(details?.structure?.condition || ''));
        setBedrooms(String(details?.rooms?.bedrooms || ''));
        setBathrooms(String(details?.rooms?.bathrooms || ''));
        setZoning(String(details?.usage?.zoning || ''));
        setParking(String(details?.parking || ''));
        setAmenitiesUtilities(String(details?.extras?.amenitiesUtilities || ''));
        setHoa(String(details?.extras?.hoaTaxes?.hoa || ''));
        setTaxes(String(details?.extras?.hoaTaxes?.taxes || ''));
        setInvestment(String(details?.extras?.investmentPotential || ''));
        setContactPhone(String(details?.extras?.contact?.phone || ''));
        setContactWhatsapp(String(details?.extras?.contact?.whatsapp || ''));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, adId, defaultCurrency]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/ads/${adId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          address,
          lat: location.lat,
          lng: location.lng,
          category, // keep existing
          currency,
          photos,
          details: {
            type,
            floorArea: { value: Number(floorAreaValue), unit: floorAreaUnit },
            landSize: landSizeValue ? { value: Number(landSizeValue), unit: landSizeUnit } : undefined,
            structure: { floors: floors ? Number(floors) : undefined, buildYear: buildYear ? Number(buildYear) : undefined, condition },
            rooms: (isResidentialCategory || (['single-family', 'multi-family', 'condo-townhouse'] as BuildingSaleType[]).includes(type)) ? { bedrooms: bedrooms ? Number(bedrooms) : undefined, bathrooms: bathrooms ? Number(bathrooms) : undefined } : undefined,
            usage: { zoning },
            parking,
            extras: {
              amenitiesUtilities: amenitiesUtilities || undefined,
              hoaTaxes: { hoa: hoa || undefined, taxes: taxes || undefined },
              investmentPotential: investment || undefined,
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
    <Modal open={open} onClose={onClose} title="Edit Building Sale Ad">
      <div className="bg-white min-w-xs sm:min-w-sm md:min-w-md lg:min-w-lg xl:min-w-2xl max-w-2xl rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
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
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Commercial building..." required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none" placeholder="Detailed description of your property..." required />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                    <div className="flex items-center gap-2 w-full px-4 py-3 border border-gray-200 rounded-lg bg-indigo-50 text-indigo-800">
                      <Building2 className="h-4 w-4" />
                      {type ? (type[0].toUpperCase() + type.slice(1)) : (isResidentialCategory ? 'Residential' : '—')}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zoning (optional)</label>
                    <div className="relative">
                      <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input value={zoning} onChange={(e) => setZoning(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="R-1 / MF / O-1" />
                    </div>
                  </div>
                </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Price</label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <div className="flex">
                        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="flex-1 pl-10 pr-2 py-3 border border-gray-200 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="1500000" required />
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-20 px-3 py-3 border-l-0 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white">
                          {Object.keys(monetary_units_flags).map((code) => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                      </div>
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
                      <input value={floors} onChange={(e) => setFloors(e.target.value)} type="number" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Build Year</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input value={buildYear} onChange={(e) => setBuildYear(e.target.value)} type="number" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="2020" />
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

                {(isResidentialCategory || (['single-family', 'multi-family', 'condo-townhouse'] as BuildingSaleType[]).includes(type)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-blue-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                      <div className="relative">
                        <Bed className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} type="number" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="4" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                      <div className="relative">
                        <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} type="number" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="2" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities & Features */}
            <div className="bg-purple-50 rounded-xl p-4 md:p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Wrench className="h-5 w-5 text-purple-600" />
                Amenities & Features
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parking</label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={parking} onChange={(e) => setParking(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Garage / Street" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities/Utilities</label>
                  <input value={amenitiesUtilities} onChange={(e) => setAmenitiesUtilities(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="Pool, Fire suppression" />
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

            {/* Images on same view */}
            <div className="space-y-4">
              <CreateAdImageSection
                adId={adId}
                photos={photos}
                onChange={setPhotos}
                title="Property Photos"
                helpText="Add photos to showcase your property. High-quality images help attract more buyers."
                icon={<Building2 className="h-5 w-5 text-indigo-600" />}
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



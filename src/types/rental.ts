export interface Rental {
  id: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  photos?: string[];
  // Category-specific structured attributes from detail tables
  details?: any;
  advanceMonths?: number;
  parkingAvailable?: boolean;
  preferredGender?: 'any' | 'male' | 'female';
  // Fully qualified category path for mixed-category listings, e.g.:
  // "property.rental", "property.for-sale.land", "property.for-sale.building", "clothing"
  category?: string;
  // Controls map rendering: 'full' shows rich marker, 'dot' shows minimal point
  markerVariant?: 'full' | 'dot';
}

export interface PropertyPlaceholderData {
  title: string;
  description: string;
  price: string;
  address: string;
  floorArea: string;
  landSize: string;
  floors: string;
  buildYear: string;
  condition: string;
  bedrooms: string;
  bathrooms: string;
  zoning: string;
  parking: string;
  amenities: string;
  development: string;
  accessUtilities: string;
  topography: string;
  beds?: string;
  billingPeriod?: string;
  advancePayment?: string;
  minLease?: string;
  maxLease?: string;
}

export type PropertyType =
  // For Sale Building Types
  | 'residential' | 'office' | 'retail' | 'warehouse' | 'manufacturing' | 'mixed-use' | 'hospitality'
  // For Sale Land Types
  | 'residential-land' | 'commercial-land' | 'industrial-land' | 'agricultural-land'
  // Rental Building Types
  | 'private-apartment' | 'private-house' | 'private-annex' | 'private-room' | 'shared-room' | 'shared-hostel'
  | 'office-rental' | 'retail-rental' | 'warehouse-rental' | 'manufacturing-rental' | 'mixed-use-rental' | 'hospitality-rental';

export function getPropertyPlaceholders(type: PropertyType): PropertyPlaceholderData {
  const currentYear = new Date().getFullYear();

  const basePlaceholders = {
    address: "123 Main Street, City",
    condition: "Excellent",
    buildYear: (currentYear - 5).toString(),
    zoning: "R-1 / C-3 / O-1",
  };

  switch (type) {
    // For Sale Building Types
    case 'residential':
      return {
        title: "Modern family home for sale...",
        description: "Beautiful residential property with spacious rooms, modern amenities, and a lovely garden...",
        price: "250000",
        floorArea: "2200",
        landSize: "0.25",
        floors: "2",
        bedrooms: "4",
        bathrooms: "3",
        parking: "2-Car Garage",
        amenities: "Swimming pool, garden, security system",
        development: "Ready for residential development",
        accessUtilities: "All utilities available",
        topography: "Level ground, suitable for construction",
        billingPeriod: "month",
        advancePayment: "1",
        minLease: "12",
        maxLease: "60",
        ...basePlaceholders,
      };

    case 'office':
      return {
        title: "Prime office building for sale...",
        description: "Professional office space with modern facilities, perfect for businesses and corporations...",
        price: "850000",
        floorArea: "5000",
        landSize: "0.5",
        floors: "3",
        bedrooms: "0",
        bathrooms: "4",
        parking: "20 parking spaces",
        amenities: "Elevator, conference rooms, HVAC system",
        development: "Ready for office development",
        accessUtilities: "All utilities available, high-speed internet",
        topography: "Level ground, suitable for construction",
        billingPeriod: "month",
        advancePayment: "2",
        minLease: "24",
        maxLease: "120",
        ...basePlaceholders,
      };

    case 'retail':
      return {
        title: "Retail space for sale in prime location...",
        description: "Excellent retail property with high foot traffic, perfect for shops and restaurants...",
        price: "650000",
        floorArea: "3000",
        landSize: "0.3",
        floors: "2",
        bedrooms: "0",
        bathrooms: "2",
        parking: "Street parking available",
        amenities: "Display windows, storage area, customer facilities",
        development: "Ready for retail development",
        accessUtilities: "All utilities available, high visibility",
        topography: "Level ground, suitable for construction",
        billingPeriod: "month",
        advancePayment: "3",
        minLease: "36",
        maxLease: "120",
        ...basePlaceholders,
      };

    case 'warehouse':
      return {
        title: "Industrial warehouse for sale...",
        description: "Spacious warehouse facility with loading docks and excellent logistics access...",
        price: "1200000",
        floorArea: "15000",
        landSize: "2.5",
        floors: "1",
        bedrooms: "0",
        bathrooms: "2",
        parking: "Truck parking, employee parking",
        amenities: "Loading docks, high ceilings, security",
        development: "Ready for warehouse development",
        accessUtilities: "All utilities available, truck access",
        topography: "Level ground, suitable for construction",
        billingPeriod: "month",
        advancePayment: "2",
        minLease: "12",
        maxLease: "60",
        ...basePlaceholders,
      };

    case 'manufacturing':
      return {
        title: "Manufacturing facility for sale...",
        description: "Industrial manufacturing space with specialized equipment areas and production capabilities...",
        price: "2000000",
        floorArea: "25000",
        landSize: "5",
        floors: "1",
        bedrooms: "0",
        bathrooms: "4",
        parking: "Large truck yard, employee parking",
        amenities: "Heavy machinery area, office space, loading bays",
        development: "Ready for manufacturing development",
        accessUtilities: "All utilities available, heavy power capacity",
        topography: "Level ground, suitable for construction",
        billingPeriod: "month",
        advancePayment: "3",
        minLease: "24",
        maxLease: "120",
        ...basePlaceholders,
      };

    case 'mixed-use':
      return {
        title: "Mixed-use property for sale...",
        description: "Versatile property combining residential and commercial spaces for maximum flexibility...",
        price: "1800000",
        floorArea: "8000",
        landSize: "0.8",
        floors: "4",
        bedrooms: "6",
        bathrooms: "8",
        parking: "Underground parking available",
        amenities: "Retail spaces, apartments, common areas",
        development: "Ready for mixed-use development",
        accessUtilities: "All utilities available, mixed zoning",
        topography: "Level ground, suitable for construction",
        billingPeriod: "month",
        advancePayment: "2",
        minLease: "12",
        maxLease: "60",
        ...basePlaceholders,
      };

    case 'hospitality':
      return {
        title: "Hotel/resort property for sale...",
        description: "Established hospitality property with rooms, amenities, and guest facilities...",
        price: "3500000",
        floorArea: "20000",
        landSize: "3",
        floors: "4",
        bedrooms: "50",
        bathrooms: "55",
        parking: "Valet parking, guest parking",
        amenities: "Restaurant, pool, conference facilities, spa",
        development: "Ready for hospitality development",
        accessUtilities: "All utilities available, guest amenities",
        topography: "Level ground, suitable for construction",
        billingPeriod: "month",
        advancePayment: "1",
        minLease: "6",
        maxLease: "24",
        ...basePlaceholders,
      };

    // For Sale Land Types
    case 'residential-land':
      return {
        title: "Residential land for sale...",
        description: "Prime residential land ready for development with utilities and good access...",
        price: "150000",
        floorArea: "",
        landSize: "0.5",
        floors: "",
        bedrooms: "",
        bathrooms: "",
        parking: "",
        amenities: "",
        development: "Ready for single family home construction",
        accessUtilities: "Road access, water and electricity available",
        topography: "Flat terrain, cleared and ready to build",
        billingPeriod: "month",
        advancePayment: "1",
        minLease: "12",
        maxLease: "60",
        ...basePlaceholders,
      };

    case 'commercial-land':
      return {
        title: "Commercial land for sale...",
        description: "Strategic commercial land in high-growth area perfect for business development...",
        price: "450000",
        floorArea: "",
        landSize: "1.2",
        floors: "",
        bedrooms: "",
        bathrooms: "",
        parking: "",
        amenities: "",
        development: "Ideal for office building, retail center, or mixed-use development",
        accessUtilities: "Main road frontage, all utilities available",
        topography: "Level ground, excellent visibility and access",
        billingPeriod: "month",
        advancePayment: "2",
        minLease: "24",
        maxLease: "120",
        ...basePlaceholders,
      };

    case 'industrial-land':
      return {
        title: "Industrial land for sale...",
        description: "Industrial-zoned land perfect for manufacturing, warehousing, or logistics operations...",
        price: "800000",
        floorArea: "",
        landSize: "5",
        floors: "",
        bedrooms: "",
        bathrooms: "",
        parking: "",
        amenities: "",
        development: "Ready for warehouse, factory, or distribution center",
        accessUtilities: "Rail access possible, heavy vehicle access, utilities",
        topography: "Flat, stable ground suitable for heavy construction",
        billingPeriod: "month",
        advancePayment: "3",
        minLease: "36",
        maxLease: "120",
        ...basePlaceholders,
      };

    case 'agricultural-land':
      return {
        title: "Agricultural land for sale...",
        description: "Fertile agricultural land with good soil quality and water rights for farming...",
        price: "200000",
        floorArea: "",
        landSize: "10",
        floors: "",
        bedrooms: "",
        bathrooms: "",
        parking: "",
        amenities: "",
        development: "Currently used for crop farming, potential for expansion",
        accessUtilities: "Water rights included, irrigation system, farm roads",
        topography: "Fertile soil, gentle slopes, good drainage",
        billingPeriod: "month",
        advancePayment: "1",
        minLease: "12",
        maxLease: "60",
        ...basePlaceholders,
      };

    // Rental Building Types
    case 'private-apartment':
      return {
        title: "Modern apartment for rent...",
        description: "Comfortable apartment with modern amenities in a convenient location...",
        price: "85000",
        floorArea: "1200",
        landSize: "",
        floors: "1",
        bedrooms: "2",
        bathrooms: "2",
        beds: "2",
        parking: "1 parking space",
        amenities: "Air conditioning, modern kitchen, balcony",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "2",
        minLease: "12",
        maxLease: "24",
        ...basePlaceholders,
      };

    case 'private-house':
      return {
        title: "Family house for rent...",
        description: "Spacious family home with garden and parking in a quiet neighborhood...",
        price: "150000",
        floorArea: "2500",
        landSize: "0.3",
        floors: "2",
        bedrooms: "4",
        bathrooms: "3",
        beds: "4",
        parking: "2-Car Garage",
        amenities: "Garden, patio, modern appliances",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "2",
        minLease: "12",
        maxLease: "36",
        ...basePlaceholders,
      };

    case 'private-annex':
      return {
        title: "Private annex for rent...",
        description: "Self-contained annex apartment with private entrance and amenities...",
        price: "60000",
        floorArea: "800",
        landSize: "",
        floors: "1",
        bedrooms: "1",
        bathrooms: "1",
        beds: "2",
        parking: "1 parking space",
        amenities: "Private entrance, kitchenette, garden access",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "1",
        minLease: "6",
        maxLease: "24",
        ...basePlaceholders,
      };

    case 'private-room':
      return {
        title: "Private room for rent...",
        description: "Comfortable private room in shared house with access to common areas...",
        price: "25000",
        floorArea: "200",
        landSize: "",
        floors: "1",
        bedrooms: "1",
        bathrooms: "1",
        beds: "1",
        parking: "Street parking available",
        amenities: "Shared kitchen, WiFi, laundry facilities",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "1",
        minLease: "3",
        maxLease: "12",
        ...basePlaceholders,
      };

    case 'shared-room':
      return {
        title: "Shared room for rent...",
        description: "Affordable shared accommodation with like-minded roommates...",
        price: "15000",
        floorArea: "300",
        landSize: "",
        floors: "1",
        bedrooms: "2",
        bathrooms: "1",
        beds: "2",
        parking: "Street parking available",
        amenities: "Shared kitchen, common area, utilities included",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "1",
        minLease: "1",
        maxLease: "12",
        ...basePlaceholders,
      };

    case 'shared-hostel':
      return {
        title: "Hostel bed for rent...",
        description: "Budget accommodation in vibrant hostel with communal facilities...",
        price: "8000",
        floorArea: "50",
        landSize: "",
        floors: "1",
        bedrooms: "8",
        bathrooms: "4",
        beds: "1",
        parking: "Limited parking available",
        amenities: "Communal kitchen, lounge, laundry, WiFi",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "0",
        minLease: "1",
        maxLease: "6",
        ...basePlaceholders,
      };

    case 'office-rental':
      return {
        title: "Office space for rent...",
        description: "Professional office environment with modern facilities and amenities...",
        price: "200000",
        floorArea: "2000",
        landSize: "",
        floors: "1",
        bedrooms: "0",
        bathrooms: "2",
        parking: "Parking included",
        amenities: "Conference rooms, reception, HVAC, WiFi",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "2",
        minLease: "12",
        maxLease: "60",
        ...basePlaceholders,
      };

    case 'retail-rental':
      return {
        title: "Retail space for rent...",
        description: "Prime retail location with high visibility and foot traffic...",
        price: "150000",
        floorArea: "1500",
        landSize: "",
        floors: "1",
        bedrooms: "0",
        bathrooms: "1",
        parking: "Street parking, loading area",
        amenities: "Display windows, storage, customer facilities",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "3",
        minLease: "24",
        maxLease: "60",
        ...basePlaceholders,
      };

    case 'warehouse-rental':
      return {
        title: "Warehouse space for rent...",
        description: "Industrial warehouse with loading docks and logistics advantages...",
        price: "300000",
        floorArea: "8000",
        landSize: "1",
        floors: "1",
        bedrooms: "0",
        bathrooms: "2",
        parking: "Truck parking, employee parking",
        amenities: "Loading docks, high ceilings, security system",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "2",
        minLease: "12",
        maxLease: "60",
        ...basePlaceholders,
      };

    case 'manufacturing-rental':
      return {
        title: "Manufacturing space for rent...",
        description: "Industrial manufacturing facility ready for production operations...",
        price: "500000",
        floorArea: "15000",
        landSize: "2",
        floors: "1",
        bedrooms: "0",
        bathrooms: "3",
        parking: "Large vehicle access, employee parking",
        amenities: "Heavy machinery areas, office space, utilities",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "3",
        minLease: "24",
        maxLease: "120",
        ...basePlaceholders,
      };

    case 'mixed-use-rental':
      return {
        title: "Mixed-use space for rent...",
        description: "Flexible space combining commercial and residential areas...",
        price: "400000",
        floorArea: "5000",
        landSize: "0.5",
        floors: "3",
        bedrooms: "4",
        bathrooms: "5",
        parking: "Mixed parking arrangements",
        amenities: "Retail and residential combination",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "2",
        minLease: "12",
        maxLease: "60",
        ...basePlaceholders,
      };

    case 'hospitality-rental':
      return {
        title: "Hospitality venue for rent...",
        description: "Established hospitality property for events, accommodation, or business...",
        price: "800000",
        floorArea: "10000",
        landSize: "1.5",
        floors: "3",
        bedrooms: "25",
        bathrooms: "30",
        parking: "Valet and guest parking",
        amenities: "Restaurant, conference, accommodation facilities",
        development: "",
        accessUtilities: "",
        topography: "",
        billingPeriod: "month",
        advancePayment: "1",
        minLease: "6",
        maxLease: "24",
        ...basePlaceholders,
      };

    default:
      return {
        title: "Property for sale...",
        description: "Detailed description of your property...",
        price: "100000",
        floorArea: "1000",
        landSize: "0.25",
        floors: "1",
        bedrooms: "2",
        bathrooms: "1",
        parking: "Available",
        amenities: "Basic amenities included",
        development: "Ready for development",
        accessUtilities: "Utilities available",
        topography: "Standard terrain",
        billingPeriod: "month",
        advancePayment: "1",
        minLease: "12",
        maxLease: "60",
        ...basePlaceholders,
      };
  }
}

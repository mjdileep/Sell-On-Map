export type CategoryKey = string;

export interface CategoryNode {
  key: CategoryKey;
  label: string;
  icon?: string;
  enabled?: boolean;
  createEnabled?: boolean;
  children?: CategoryNode[];
}

// Single source of truth for category hierarchy
export const categoryTree: CategoryNode = {
  key: 'all',
  label: 'All',
  icon: 'Layers',
  enabled: true,
  children: [
    {
      key: 'property',
      label: 'Property',
      icon: 'Home',
      enabled: true,
      children: [
        {
          key: 'property.rental',
          label: 'Rental',
          icon: 'Home',
          enabled: true,
          createEnabled: false,
          children: [
            {
              key: 'property.rental.building',
              label: 'Building',
              icon: 'Building2',
              enabled: true,
              children: [
                {
                  key: 'property.rental.building.residential',
                  label: 'Residential',
                  enabled: true,
                  children: [
                    {
                      key: 'property.rental.building.residential.private',
                      label: 'Private',
                      enabled: true,
                      children: [
                        { key: 'property.rental.building.residential.private.apartment', label: 'Apartment', enabled: true},
                        { key: 'property.rental.building.residential.private.house', label: 'House', enabled: true },
                        { key: 'property.rental.building.residential.private.annex', label: 'Annex', enabled: true },
                      ],
                    },
                    {
                      key: 'property.rental.building.residential.shared',
                      label: 'Shared',
                      enabled: true,
                      children: [
                        { key: 'property.rental.building.residential.shared.room', label: 'Room', enabled: true },
                        { key: 'property.rental.building.residential.shared.hostel', label: 'Hostel', enabled: true },
                      ],
                    },
                  ],
                },
                {
                  key: 'property.rental.building.commercial',
                  label: 'Commercial',
                  enabled: true,
                  children: [
                    { key: 'property.rental.building.commercial.office', label: 'Office', enabled: true },
                    { key: 'property.rental.building.commercial.retail', label: 'Retail', enabled: true },
                    { key: 'property.rental.building.commercial.other', label: 'Other', enabled: true },
                  ],
                },
                {
                  key: 'property.rental.building.industrial',
                  label: 'Industrial',
                  enabled: true,
                  children: [
                    { key: 'property.rental.building.industrial.warehouse', label: 'Warehouse', enabled: true },
                    { key: 'property.rental.building.industrial.manufacturing', label: 'Manufacturing', enabled: true },
                    { key: 'property.rental.building.industrial.flex-space', label: 'Flex Space', enabled: true },
                  ],
                },
                {
                  key: 'property.rental.building.hospitality',
                  label: 'Hospitality',
                  enabled: true,
                  children: [
                    { key: 'property.rental.building.hospitality.hotel', label: 'Hotel', enabled: true },
                    { key: 'property.rental.building.hospitality.guest-house', label: 'Guest House', enabled: true },
                    { key: 'property.rental.building.hospitality.hostel', label: 'Hostel', enabled: true },
                  ],
                },
              ],
            },
            {
              key: 'property.rental.land',
              label: 'Land',
              icon: 'Landmark',
              enabled: true,
              children: [
                { key: 'property.rental.land.residential', label: 'Residential', enabled: true },
                { key: 'property.rental.land.commercial', label: 'Commercial', enabled: true },
                { key: 'property.rental.land.industrial', label: 'Industrial', enabled: true },
                { key: 'property.rental.land.agricultural', label: 'Agricultural', enabled: true },
                { key: 'property.rental.land.other', label: 'Other', enabled: true },
              ],
            },
          ],
        },
        {
          key: 'property.for-sale',
          label: 'For Sale',
          icon: 'Landmark',
          enabled: true,
          children: [
            {
              key: 'property.for-sale.land',
              label: 'Land',
              icon: 'Landmark',
              enabled: true,
              createEnabled: false,
              children: [
                { key: 'property.for-sale.land.residential', label: 'Residential', enabled: true },
                { key: 'property.for-sale.land.commercial', label: 'Commercial', enabled: true },
                { key: 'property.for-sale.land.industrial', label: 'Industrial', enabled: true },
                { key: 'property.for-sale.land.agricultural', label: 'Agricultural', enabled: true },
                { key: 'property.for-sale.land.other', label: 'Other', enabled: true },
              ],
            },
            {
              key: 'property.for-sale.building',
              label: 'Building',
              icon: 'Building2',
              enabled: true,
              createEnabled: false,
              children: [
                {
                  key: 'property.for-sale.building.residential',
                  label: 'Residential',
                  enabled: true,
                  children: [
                    { key: 'property.for-sale.building.residential.apartment', label: 'Apartment', enabled: true },
                    { key: 'property.for-sale.building.residential.house', label: 'House', enabled: true },
                  ],
                },
                {
                  key: 'property.for-sale.building.commercial',
                  label: 'Commercial',
                  enabled: true,
                  children: [
                    { key: 'property.for-sale.building.commercial.office', label: 'Office', enabled: true },
                    { key: 'property.for-sale.building.commercial.retail', label: 'Retail', enabled: true },
                    { key: 'property.for-sale.building.commercial.hostel', label: 'Hostel', enabled: true },
                    { key: 'property.for-sale.building.commercial.other', label: 'Other', enabled: true },
                  ],
                },
                {
                  key: 'property.for-sale.building.industrial',
                  label: 'Industrial',
                  enabled: true,
                  children: [
                    { key: 'property.for-sale.building.industrial.warehouse', label: 'Warehouse', enabled: true },
                    { key: 'property.for-sale.building.industrial.manufacturing', label: 'Manufacturing', enabled: true },
                    { key: 'property.for-sale.building.industrial.flex-space', label: 'Flex Space', enabled: true },
                  ],
                },
                {
                  key: 'property.for-sale.building.hospitality',
                  label: 'Hospitality',
                  enabled: true,
                  children: [
                    { key: 'property.for-sale.building.hospitality.hotel', label: 'Hotel', enabled: true },
                    { key: 'property.for-sale.building.hospitality.guest-house', label: 'Guest House', enabled: true },
                    { key: 'property.for-sale.building.hospitality.hostel', label: 'Hostel', enabled: true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
  ],
};

export function flattenCategories(node: CategoryNode): CategoryNode[] {
  const result: CategoryNode[] = [];
  function dfs(n: CategoryNode) {
    result.push(n);
    if (n.children) n.children.forEach(dfs);
  }
  dfs(node);
  return result;
}



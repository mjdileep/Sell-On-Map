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
              key: 'property.rental.land',
              label: 'Land',
              icon: 'Landmark',
              enabled: true,
              children: [
                { key: 'property.rental.land.commercial', label: 'Commercial', enabled: true },
                { key: 'property.rental.land.industrial', label: 'Industrial', enabled: true },
                { key: 'property.rental.land.agricultural', label: 'Agricultural', enabled: true },
              ],
            },
            {
              key: 'property.rental.building',
              label: 'Building',
              icon: 'Building2',
              enabled: true,
              children: [
                {
                  key: 'property.rental.building.residential',
                  label: 'Residential',
                  enabled: true
                },
                {
                  key: 'property.rental.building.commercial',
                  label: 'Commercial',
                  enabled: true,
                  children: [
                    { key: 'property.rental.building.commercial.office', label: 'Office', enabled: true },
                    { key: 'property.rental.building.commercial.retail', label: 'Retail', enabled: true },
                  ],
                },
                {
                  key: 'property.rental.building.industrial',
                  label: 'Industrial',
                  enabled: true,
                  children: [
                    { key: 'property.rental.building.industrial.warehouse', label: 'Warehouse', enabled: true },
                    { key: 'property.rental.building.industrial.manufacturing', label: 'Manufacturing', enabled: true },
                  ],
                },
                { key: 'property.rental.building.mixed-use', label: 'Mixed Use', enabled: true },
                { key: 'property.rental.building.hospitality', label: 'Hospitality', enabled: true },
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
                  enabled: true
                },
                {
                  key: 'property.for-sale.building.commercial',
                  label: 'Commercial',
                  enabled: true,
                  children: [
                    { key: 'property.for-sale.building.commercial.office', label: 'Office', enabled: true },
                    { key: 'property.for-sale.building.commercial.retail', label: 'Retail', enabled: true },
                  ],
                },
                {
                  key: 'property.for-sale.building.industrial',
                  label: 'Industrial',
                  enabled: true,
                  children: [
                    { key: 'property.for-sale.building.industrial.warehouse', label: 'Warehouse', enabled: true },
                    { key: 'property-for-sale.building.industrial.manufacturing', label: 'Manufacturing', enabled: true },
                  ],
                },
                { key: 'property.for-sale.building.mixed-use', label: 'Mixed Use', enabled: true },
                { key: 'property.for-sale.building.hospitality', label: 'Hospitality', enabled: true },
              ],
            },
          ],
        },
      ],
    },
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



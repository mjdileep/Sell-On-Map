# Location Search with Multiple Providers

The MapSearch component now supports both OpenStreetMap (OSM) and Google Places API as location providers.

## Usage Examples

### Using OpenStreetMap (Default)
```tsx
import MapSearch from '@/components/MapSearch';

function MyComponent() {
  const handleLocationSelect = (lat: number, lon: number) => {
    console.log('Selected location:', { lat, lon });
  };

  return (
    <MapSearch 
      onSelect={handleLocationSelect}
      // provider="osm" // This is the default
    />
  );
}
```

### Using Google Places API
```tsx
import MapSearch from '@/components/MapSearch';

function MyComponent() {
  const handleLocationSelect = (lat: number, lon: number) => {
    console.log('Selected location:', { lat, lon });
  };

  return (
    <MapSearch 
      onSelect={handleLocationSelect}
      provider="google"
    />
  );
}
```

### Using in MapPicker Component
```tsx
import MapPicker from '@/components/MapPicker';

function MyForm() {
  const [location, setLocation] = useState({ lat: 40.7128, lng: -74.0060 });

  return (
    <MapPicker
      value={location}
      onChange={setLocation}
      searchProvider="google" // Switch between 'google' and 'osm'
    />
  );
}
```

## API Configuration

For Google Places to work, ensure you have:

1. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable set
2. Google Places API enabled in your Google Cloud Console
3. Proper API key restrictions configured

## Provider Differences

### OpenStreetMap (OSM)
- **Pros**: Free, no API key required, global coverage
- **Cons**: Less detailed for some regions, fewer commercial locations
- **Best for**: General geographic locations, international coverage

### Google Places
- **Pros**: Highly accurate, excellent commercial location data, rich details
- **Cons**: Requires API key, usage costs, rate limits
- **Best for**: Commercial locations, detailed address information, better user experience

## Fallback Behavior

When using Google Places provider:
- If the API key is missing, it automatically falls back to OSM
- If the Google API request fails, it falls back to OSM
- Error handling ensures the search always works

## Technical Implementation

The component uses:
- OSM Nominatim API directly for OSM searches
- Custom API endpoint `/api/places/autocomplete` for Google Places
- TypeScript interfaces ensure type safety across both providers
- Consistent response format regardless of provider

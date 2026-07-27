import type { LocationData, MapCoordinates, AutocompleteSuggestion } from '../types/location';
import type { RouteData, VehicleType } from '../types/route';
import { fareService } from './fareService';

// Default Center: Karachi, Pakistan
export const DEFAULT_MAP_CENTER: MapCoordinates = {
  lat: 24.8607,
  lng: 67.0011,
};

export const DEFAULT_MAP_ZOOM = 13;

class GoogleMapsService {
  private loadPromise: Promise<typeof google.maps> | null = null;
  private googleMaps: typeof google.maps | null = null;

  // In-Memory Route Cache & LocationIQ Prediction Details Cache
  private routeCache: Map<string, RouteData> = new Map();
  private predictionDetailsCache: Map<string, LocationData> = new Map();

  /**
   * Loads Google Maps JS API script using environment key VITE_GOOGLE_MAPS_API_KEY.
   */
  public async loadGoogleMaps(): Promise<typeof google.maps> {
    if (this.googleMaps || (window as unknown as { google?: { maps: typeof google.maps } }).google?.maps) {
      this.googleMaps = (window as unknown as { google: { maps: typeof google.maps } }).google.maps;
      return this.googleMaps;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    if (!apiKey || apiKey.includes('MOCK') || apiKey.includes('YOUR_KEY')) {
      console.warn('RideMate MapService: Operating in Fallback/Demo mode.');
      return Promise.reject(new Error('Mock API key detected. Operating in Fallback/Demo mode.'));
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const scriptId = 'google-maps-js-sdk';
      const existingScript = document.getElementById(scriptId);

      if (existingScript) {
        existingScript.addEventListener('load', () => {
          this.googleMaps = window.google.maps;
          resolve(window.google.maps);
        });
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places,geometry&v=weekly`;
      script.async = true;
      script.defer = true;

      const timeoutId = setTimeout(() => {
        reject(new Error('Google Maps SDK load timeout. Falling back to demo mode.'));
      }, 3000);

      script.onload = () => {
        clearTimeout(timeoutId);
        if (window.google && window.google.maps) {
          this.googleMaps = window.google.maps;
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps SDK loaded but window.google.maps is undefined.'));
        }
      };

      script.onerror = (err) => {
        clearTimeout(timeoutId);
        console.error('Failed to load Google Maps SDK script', err);
        reject(new Error('Failed to load Google Maps JS SDK script. Check your connection or API key.'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Initializes a Google Maps instance on an HTML container element.
   */
  public async createMap(
    container: HTMLElement,
    options?: Partial<google.maps.MapOptions>
  ): Promise<google.maps.Map> {
    const maps = await this.loadGoogleMaps();

    const lightMapStyle: google.maps.MapTypeStyle[] = [];

    const mapId = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID';

    const defaultOptions: google.maps.MapOptions = {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      mapId: mapId,
      styles: lightMapStyle,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    };

    return new maps.Map(container, { ...defaultOptions, ...options });
  }

  /**
   * Calculates comprehensive route details using Google Directions API or fallback geometry engine.
   */
  public async calculateRoute(
    origin: LocationData,
    destination: LocationData,
    options?: { vehicleType?: VehicleType; provideAlternatives?: boolean }
  ): Promise<RouteData> {
    // Route Validation
    if (origin.latitude === destination.latitude && origin.longitude === destination.longitude) {
      throw new Error('Pickup and Destination locations cannot be identical.');
    }

    const vehicleType = options?.vehicleType || 'car';
    const cacheKey = `${origin.place_id}_${destination.place_id}_${vehicleType}`;

    if (this.routeCache.has(cacheKey)) {
      return this.routeCache.get(cacheKey)!;
    }

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      if (apiKey && !apiKey.includes('MOCK') && !apiKey.includes('YOUR_KEY')) {
        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs',
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: {
                  latitude: origin.latitude,
                  longitude: origin.longitude,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: destination.latitude,
                  longitude: destination.longitude,
                },
              },
            },
            travelMode: 'DRIVE',
            computeAlternativeRoutes: options?.provideAlternatives ?? true,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const primaryRoute = data.routes[0];
            const distanceMeters = primaryRoute.distanceMeters || 0;
            const durationSecs = parseInt(primaryRoute.duration?.replace('s', '') || '0', 10);

            const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
            const durationMins = Math.max(Math.round(durationSecs / 60), 1);
            const trafficMins = durationMins;

            const fare = fareService.calculateFare(distanceKm, durationMins, vehicleType);

            const mainRouteData: RouteData = {
              route_id: `route_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              pickup_location: origin,
              destination_location: destination,
              distance_km: distanceKm,
              estimated_duration: durationMins,
              traffic_duration: trafficMins,
              polyline: primaryRoute.polyline?.encodedPolyline || '',
              fare_estimate: fare,
              warnings: [],
              steps: [],
            };

            this.cacheRoute(cacheKey, mainRouteData);
            return mainRouteData;
          }
        }
      }
    } catch (err) {
      console.warn('[googleMapsService] Routes API (New) computeRoutes error:', err);
    }

    return this.calculateFallbackRoute(origin, destination, vehicleType);
  }

  /**
   * Helper fallback geometry route calculator when Google API is offline/mock key.
   */
  private calculateFallbackRoute(
    origin: LocationData,
    destination: LocationData,
    vehicleType: VehicleType
  ): RouteData {
    console.warn('[GoogleMapsService] Using fallback mock location data — check LocationIQ/Google Maps API key configuration');
    const latDiff = origin.latitude - destination.latitude;
    const lngDiff = origin.longitude - destination.longitude;
    const euclideanDeg = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    // Approx road distance factor ~1.3 multiplier over direct line
    const distanceKm = Math.round(euclideanDeg * 111.0 * 1.3 * 10) / 10;
    const durationMins = Math.max(Math.round(distanceKm * 2.5), 5);
    const fare = fareService.calculateFare(distanceKm, durationMins, vehicleType);

    const fallbackRoute: RouteData = {
      route_id: `mock_route_${Date.now()}`,
      pickup_location: origin,
      destination_location: destination,
      distance_km: distanceKm,
      estimated_duration: durationMins,
      traffic_duration: Math.round(durationMins * 1.1),
      polyline: 'mock_polyline_string_fallback',
      fare_estimate: fare,
      warnings: ['Demo route calculation based on geometric estimation.'],
      steps: [
        {
          instructions: `Head towards ${destination.area || destination.city || 'destination'}`,
          distance_km: distanceKm,
          duration_mins: durationMins,
        },
      ],
    };

    return fallbackRoute;
  }

  /**
   * Calculates distance in KM between two coordinates.
   */
  public async calculateDistance(origin: MapCoordinates, destination: MapCoordinates): Promise<number> {
    const latDiff = origin.lat - destination.lat;
    const lngDiff = origin.lng - destination.lng;
    return Math.round(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.0 * 10) / 10;
  }

  /**
   * Calculates estimated time of arrival (ETA) in minutes.
   */
  public async calculateETA(origin: MapCoordinates, destination: MapCoordinates): Promise<number> {
    const dist = await this.calculateDistance(origin, destination);
    return Math.round(dist * 2.5);
  }

  /**
   * Caches route calculation in memory.
   */
  public cacheRoute(key: string, route: RouteData): void {
    this.routeCache.set(key, route);
  }

  /**
   * Clears route cache.
   */
  public clearRoute(): void {
    this.routeCache.clear();
  }

  /**
   * Fetches Places Autocomplete suggestions strictly from modern Google Places API (New).
   */
  /**
   * Fetches Places Autocomplete suggestions using LocationIQ API.
   */
  public async getPlacePredictions(input: string): Promise<AutocompleteSuggestion[]> {
    if (!input || !input.trim()) return [];
    const query = input.trim();
    const locationIqKey = import.meta.env.VITE_LOCATIONIQ_KEY || '';

    if (locationIqKey && !locationIqKey.includes('MOCK')) {
      try {
        const url = `https://api.locationiq.com/v1/autocomplete?key=${locationIqKey}&q=${encodeURIComponent(query)}&countrycodes=pk&limit=5&format=json`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            const mappedSuggestions: AutocompleteSuggestion[] = json.map((item: any, idx: number) => {
              const mainText = item.display_place || item.display_name?.split(',')[0] || query;
              const secondaryText = item.display_address || item.display_name?.split(',').slice(1).join(',').trim() || 'Karachi, Pakistan';
              const placeId = String(item.place_id || `lociq_${Date.now()}_${idx}`);
              const displayName = item.display_name || `${mainText}, ${secondaryText}`;

              const locationData: LocationData = {
                place_id: placeId,
                formatted_address: displayName,
                latitude: parseFloat(item.lat || '24.8607'),
                longitude: parseFloat(item.lon || '67.0011'),
                city: item.address?.city || item.address?.town || 'Karachi',
                area: item.address?.suburb || item.address?.neighbourhood || mainText,
                country: item.address?.country || 'Pakistan',
                name: mainText,
              };

              this.predictionDetailsCache.set(placeId, locationData);

              return {
                place_id: placeId,
                description: displayName,
                main_text: mainText,
                secondary_text: secondaryText,
              };
            });

            // Deduplicate suggestions by place_id keeping the first occurrence
            const seenPlaceIds = new Set<string>();
            const uniqueSuggestions: AutocompleteSuggestion[] = [];

            for (const s of mappedSuggestions) {
              if (!seenPlaceIds.has(s.place_id)) {
                seenPlaceIds.add(s.place_id);
                uniqueSuggestions.push(s);
              }
            }

            return uniqueSuggestions;
          }
        }
      } catch (err) {
        console.warn('[GoogleMapsService] LocationIQ Autocomplete error:', err);
      }
    }

    return this.getFallbackKarachiPredictions(query);
  }

  private getFallbackKarachiPredictions(query: string): AutocompleteSuggestion[] {
    console.warn('[GoogleMapsService] Using fallback mock location data — check LocationIQ/Google Maps API key configuration');
    const karachiLocations = [
      { place_id: 'pk_khi_clifton_01', description: 'Clifton, Karachi', main_text: 'Clifton', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_gulshan_01', description: 'Gulshan-e-Iqbal, Karachi', main_text: 'Gulshan-e-Iqbal', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_pechs_01', description: 'PECHS Block 6, Karachi', main_text: 'PECHS Block 6', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_dilkusha_01', description: 'Dilkusha Towers, Karachi', main_text: 'Dilkusha Towers', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_defence_01', description: 'Defence Phase 5, Karachi', main_text: 'Defence Phase 5', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_nazimabad_01', description: 'Nazimabad, Karachi', main_text: 'Nazimabad', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_saddar_01', description: 'Saddar, Karachi', main_text: 'Saddar', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_quaidabad_01', description: 'Quaidabad, Karachi', main_text: 'Quaidabad', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_kalaboard_01', description: 'Kala Board, Karachi', main_text: 'Kala Board', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_nipa_01', description: 'Nipa Chowrangi, Karachi', main_text: 'Nipa Chowrangi', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_johar_01', description: 'Gulistan-e-Johar, Karachi', main_text: 'Gulistan-e-Johar', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_sharahefaisal_01', description: 'Shahrah-e-Faisal, Karachi', main_text: 'Shahrah-e-Faisal', secondary_text: 'Karachi, Sindh, Pakistan' },
      { place_id: 'pk_khi_tariqroad_01', description: 'Tariq Road, Karachi', main_text: 'Tariq Road', secondary_text: 'Karachi, Sindh, Pakistan' },
    ];

    const filtered = karachiLocations.filter(
      (loc) => loc.main_text.toLowerCase().includes(query.toLowerCase()) || loc.description.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.length > 0 ? filtered : [
      { place_id: `custom_${Date.now()}`, description: `${query}, Karachi`, main_text: query, secondary_text: 'Karachi, Sindh, Pakistan' }
    ];
  }

  /**
   * Retrieves full details for a selected place ID using LocationIQ API or Karachi mock fallback.
   */
  public async getPlaceDetails(placeId: string): Promise<LocationData> {
    if (this.predictionDetailsCache.has(placeId)) {
      return this.predictionDetailsCache.get(placeId)!;
    }
    const mockDetailsMap: Record<string, LocationData> = {
      pk_khi_clifton_01: { place_id: 'pk_khi_clifton_01', formatted_address: 'Clifton, Karachi, Pakistan', latitude: 24.8138, longitude: 67.0333, city: 'Karachi', area: 'Clifton', country: 'Pakistan', name: 'Clifton' },
      pk_khi_gulshan_01: { place_id: 'pk_khi_gulshan_01', formatted_address: 'Gulshan-e-Iqbal, Karachi, Pakistan', latitude: 24.9204, longitude: 67.0944, city: 'Karachi', area: 'Gulshan-e-Iqbal', country: 'Pakistan', name: 'Gulshan-e-Iqbal' },
      pk_khi_pechs_01: { place_id: 'pk_khi_pechs_01', formatted_address: 'PECHS Block 6, Karachi, Pakistan', latitude: 24.8615, longitude: 67.0700, city: 'Karachi', area: 'PECHS', country: 'Pakistan', name: 'PECHS' },
      pk_khi_dilkusha_01: { place_id: 'pk_khi_dilkusha_01', formatted_address: 'Dilkusha Towers, Karachi, Pakistan', latitude: 24.8607, longitude: 67.0011, city: 'Karachi', area: 'Dilkusha Towers', country: 'Pakistan', name: 'Dilkusha Towers' },
      pk_khi_defence_01: { place_id: 'pk_khi_defence_01', formatted_address: 'Defence Phase 5, Karachi, Pakistan', latitude: 24.8211, longitude: 67.0622, city: 'Karachi', area: 'Defence Phase 5', country: 'Pakistan', name: 'Defence Phase 5' },
      pk_khi_nazimabad_01: { place_id: 'pk_khi_nazimabad_01', formatted_address: 'Nazimabad, Karachi, Pakistan', latitude: 24.9122, longitude: 67.0311, city: 'Karachi', area: 'Nazimabad', country: 'Pakistan', name: 'Nazimabad' },
      pk_khi_saddar_01: { place_id: 'pk_khi_saddar_01', formatted_address: 'Saddar, Karachi, Pakistan', latitude: 24.8560, longitude: 67.0150, city: 'Karachi', area: 'Saddar', country: 'Pakistan', name: 'Saddar' },
      pk_khi_quaidabad_01: { place_id: 'pk_khi_quaidabad_01', formatted_address: 'Quaidabad, Karachi, Pakistan', latitude: 24.8500, longitude: 67.2000, city: 'Karachi', area: 'Quaidabad', country: 'Pakistan', name: 'Quaidabad' },
      pk_khi_kalaboard_01: { place_id: 'pk_khi_kalaboard_01', formatted_address: 'Kala Board, Karachi, Pakistan', latitude: 24.8700, longitude: 67.1800, city: 'Karachi', area: 'Kala Board', country: 'Pakistan', name: 'Kala Board' },
    };

    if (placeId.startsWith('pk_khi_') || placeId.startsWith('custom_') || mockDetailsMap[placeId]) {
      return mockDetailsMap[placeId] || {
        place_id: placeId,
        formatted_address: `${placeId.replace(/_/g, ' ')}, Karachi, Pakistan`,
        latitude: 24.8607,
        longitude: 67.0011,
        city: 'Karachi',
        area: 'Karachi',
        country: 'Pakistan',
        name: placeId,
      };
    }

    const locationIqKey = import.meta.env.VITE_LOCATIONIQ_KEY || '';
    if (locationIqKey && !locationIqKey.includes('MOCK')) {
      try {
        const url = `https://api.locationiq.com/v1/search?key=${locationIqKey}&q=${encodeURIComponent(placeId)}&countrycodes=pk&format=json`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const item = Array.isArray(data) ? data[0] : data;
          if (item && item.lat && item.lon) {
            const displayName = item.display_name || 'Selected Location';
            const namePart = displayName.split(',')[0];
            return {
              place_id: placeId,
              formatted_address: displayName,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              city: item.address?.city || item.address?.town || 'Karachi',
              area: item.address?.suburb || item.address?.neighbourhood || namePart,
              country: item.address?.country || 'Pakistan',
              name: namePart,
            };
          }
        }
      } catch (err) {
        console.warn('[GoogleMapsService] LocationIQ Place Details error:', err);
      }
    }

    return {
      place_id: placeId,
      formatted_address: `${placeId.replace(/_/g, ' ')}, Karachi, Pakistan`,
      latitude: 24.8607,
      longitude: 67.0011,
      city: 'Karachi',
      area: 'Karachi',
      country: 'Pakistan',
      name: placeId,
    };
  }

  /**
   * Reverse Geocodes coordinates to a LocationData object using LocationIQ API.
   */
  public async reverseGeocode(coords: MapCoordinates): Promise<LocationData> {
    const locationIqKey = import.meta.env.VITE_LOCATIONIQ_KEY || '';

    if (locationIqKey && !locationIqKey.includes('MOCK')) {
      try {
        const url = `https://api.locationiq.com/v1/reverse?key=${locationIqKey}&lat=${coords.lat}&lon=${coords.lng}&format=json`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            const displayName = data.display_name;
            const namePart = displayName.split(',')[0];
            return {
              place_id: data.place_id ? String(data.place_id) : `rev_${coords.lat}_${coords.lng}`,
              formatted_address: displayName,
              latitude: coords.lat,
              longitude: coords.lng,
              city: data.address?.city || data.address?.town || data.address?.county || 'Karachi',
              area: data.address?.suburb || data.address?.neighbourhood || data.address?.road || namePart,
              country: data.address?.country || 'Pakistan',
              name: namePart,
            };
          }
        }
      } catch (err) {
        console.warn('[GoogleMapsService] LocationIQ Reverse Geocode error:', err);
      }
    }

    return {
      place_id: `rev_${coords.lat}_${coords.lng}`,
      formatted_address: `Coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      latitude: coords.lat,
      longitude: coords.lng,
      city: 'Karachi',
      area: 'Karachi',
      country: 'Pakistan',
    };
  }

  /**
   * Creates a custom styled map marker using supported AdvancedMarkerElement.
   */
  public async createMarker(
    map: google.maps.Map,
    position: MapCoordinates,
    title: string,
    iconUrl?: string
  ): Promise<any> {
    await this.loadGoogleMaps();

    if (window.google?.maps?.marker?.AdvancedMarkerElement) {
      const el = document.createElement('div');
      if (iconUrl) {
        el.innerHTML = `<img src="${iconUrl}" width="32" height="32" style="display:block; filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.4));" />`;
      } else {
        el.style.cssText = 'width: 18px; height: 18px; border-radius: 50%; background: #6366f1; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);';
      }

      return new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        title,
        content: el,
      });
    }

    return new (window.google.maps as any).Marker({
      position,
      map,
      title,
    });
  }

  /**
   * Route Calculation Preview
   */
  public async calculateRoutePreview(
    origin: MapCoordinates,
    destination: MapCoordinates
  ): Promise<{ distanceKm: number; durationMins: number; polyline: string }> {
    const dist = await this.calculateDistance(origin, destination);
    const duration = await this.calculateETA(origin, destination);

    return {
      distanceKm: dist,
      durationMins: duration,
      polyline: 'placeholder_polyline_sprint_9b',
    };
  }

  /**
   * Distance Matrix Placeholder
   */
  public async calculateDistanceMatrix(
    origins: MapCoordinates[],
    destinations: MapCoordinates[]
  ): Promise<{ distanceKm: number; durationMins: number }[][]> {
    return origins.map((org) =>
      destinations.map((dest) => {
        const est = Math.sqrt(Math.pow(org.lat - dest.lat, 2) + Math.pow(org.lng - dest.lng, 2)) * 111;
        return {
          distanceKm: Math.round(est * 10) / 10,
          durationMins: Math.round(est * 2.5),
        };
      })
    );
  }
}

export const googleMapsService = new GoogleMapsService();
export default googleMapsService;

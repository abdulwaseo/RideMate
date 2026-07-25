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
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private geocoder: google.maps.Geocoder | null = null;

  // In-Memory Route Cache
  private routeCache: Map<string, RouteData> = new Map();
  private isQuotaExceeded: boolean = false;

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

    const darkMapStyle: google.maps.MapTypeStyle[] = [
      { elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6366f1' }],
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#818cf8' }],
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#374151' }],
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#1f2937' }],
      },
      {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }],
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#0f172a' }],
      },
    ];

    const mapId = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID';

    const defaultOptions: google.maps.MapOptions = {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      mapId: mapId,
      styles: darkMapStyle,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    };

    const mapInstance = new maps.Map(container, { ...defaultOptions, ...options });

    const dummyNode = document.createElement('div');
    this.placesService = new maps.places.PlacesService(dummyNode);
    this.autocompleteService = new maps.places.AutocompleteService();
    this.geocoder = new maps.Geocoder();

    return mapInstance;
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
  public async getPlacePredictions(input: string): Promise<AutocompleteSuggestion[]> {
    if (!input || !input.trim()) return [];
    const query = input.trim();
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    // Fast-path: If Google Maps API quota limit (429) was reached earlier, use instant local Karachi location dictionary
    if (this.isQuotaExceeded) {
      return this.getFallbackKarachiPredictions(query);
    }

    // 1. Try modern Places JS SDK AutocompleteSuggestion class if available
    try {
      await this.loadGoogleMaps();
      const placesLib = (window.google?.maps?.places as any);
      if (placesLib?.AutocompleteSuggestion) {
        const { suggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          includedRegionCodes: ['pk'],
        });
        if (suggestions && suggestions.length > 0) {
          return suggestions.map((s: any) => {
            const pred = s.placePrediction;
            return {
              place_id: pred.placeId,
              description: pred.text?.text || pred.structuredFormat?.mainText?.text || query,
              main_text: pred.structuredFormat?.mainText?.text || pred.text?.text || query,
              secondary_text: pred.structuredFormat?.secondaryText?.text || '',
            };
          });
        }
      }
    } catch (err) {
      // JS SDK failed or rate-limited
    }

    // 2. Try modern Places API (New) REST Endpoint
    if (apiKey) {
      try {
        const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify({
            input: query,
            includedRegionCodes: ['pk'],
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const items = json.suggestions || [];
          if (items.length > 0) {
            return items.map((item: any) => {
              const pred = item.placePrediction;
              return {
                place_id: pred.placeId,
                description: pred.text?.text || pred.structuredFormat?.mainText?.text || query,
                main_text: pred.structuredFormat?.mainText?.text || pred.text?.text || query,
                secondary_text: pred.structuredFormat?.secondaryText?.text || '',
              };
            });
          }
        } else if (res.status === 429) {
          this.isQuotaExceeded = true;
          console.warn('[GoogleMapsService] Google Places API Quota Exceeded (HTTP 429). Switching to instant Karachi fallback mode.');
          return this.getFallbackKarachiPredictions(query);
        }
      } catch (err) {
        // Fetch failed
      }
    }

    // 3. Fallback to legacy AutocompleteService if available and enabled
    try {
      if (window.google?.maps?.places?.AutocompleteService) {
        if (!this.autocompleteService) {
          this.autocompleteService = new window.google.maps.places.AutocompleteService();
        }
        return new Promise((resolve) => {
          this.autocompleteService!.getPlacePredictions(
            { input: query, componentRestrictions: { country: 'pk' } },
            (predictions, status) => {
              if (status === 'OK' && predictions && predictions.length > 0) {
                resolve(
                  predictions.map((p) => ({
                    place_id: p.place_id,
                    description: p.description,
                    main_text: p.structured_formatting?.main_text || p.description,
                    secondary_text: p.structured_formatting?.secondary_text || '',
                  }))
                );
              } else {
                resolve([]);
              }
            }
          );
        });
      }
    } catch (e) {
      console.warn('[GoogleMapsService] Legacy AutocompleteService fallback failed:', e);
    }

    return this.getFallbackKarachiPredictions(query);
  }

  private getFallbackKarachiPredictions(query: string): AutocompleteSuggestion[] {
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
   * Retrieves full details for a selected place ID strictly from modern Google Places API (New).
   */
  public async getPlaceDetails(placeId: string): Promise<LocationData> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    // 1. Try modern Places JS SDK Place class if available
    try {
      await this.loadGoogleMaps();
      const placesLib = (window.google?.maps?.places as any);
      if (placesLib?.Place) {
        console.log('[GoogleMapsService] Calling Places JS SDK Place class for place_id:', placeId);
        const place = new placesLib.Place({ id: placeId });
        await place.fetchFields({
          fields: ['location', 'formattedAddress', 'addressComponents', 'displayName'],
        });

        if (place.location) {
          const lat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
          const lng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
          const parsed = this.parseAddressComponents(place.addressComponents || []);

          return {
            place_id: placeId,
            formatted_address: place.formattedAddress || place.displayName || 'Selected Location',
            latitude: lat,
            longitude: lng,
            city: parsed.city || 'Karachi',
            area: parsed.area,
            country: parsed.country || 'Pakistan',
            name: place.displayName,
          };
        }
      }
    } catch (err) {
      console.warn('[GoogleMapsService] Places JS SDK Place class exception:', err);
    }

    // 2. Try modern Places API (New) REST Details endpoint
    if (apiKey) {
      try {
        console.log('[GoogleMapsService] Calling Places API (New) REST Details endpoint for place_id:', placeId);
        const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,formattedAddress,location,addressComponents,displayName',
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.location) {
            const lat = data.location.latitude;
            const lng = data.location.longitude;
            const parsed = this.parseAddressComponents(data.addressComponents || []);

            return {
              place_id: placeId,
              formatted_address: data.formattedAddress || data.displayName?.text || 'Selected Location',
              latitude: lat,
              longitude: lng,
              city: parsed.city || 'Karachi',
              area: parsed.area,
              country: parsed.country || 'Pakistan',
              name: data.displayName?.text,
            };
          }
        } else if (res.status === 429) {
          this.isQuotaExceeded = true;
        }
      } catch (err) {
        console.warn('[GoogleMapsService] Places API (New) REST details exception:', err);
      }
    }

    // 3. Fallback to legacy PlacesService if available
    try {
      if (!this.placesService && window.google?.maps?.places) {
        const dummyNode = document.createElement('div');
        this.placesService = new window.google.maps.places.PlacesService(dummyNode);
      }
      if (this.placesService) {
        return new Promise((resolve, reject) => {
          this.placesService!.getDetails(
            {
              placeId,
              fields: ['place_id', 'formatted_address', 'geometry', 'address_components', 'name'],
            },
            (place, status) => {
              if (status === 'OK' && place && place.geometry?.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const parsed = this.parseAddressComponents(place.address_components || []);

                resolve({
                  place_id: place.place_id || placeId,
                  formatted_address: place.formatted_address || place.name || 'Selected Location',
                  latitude: lat,
                  longitude: lng,
                  city: parsed.city || 'Karachi',
                  area: parsed.area,
                  country: parsed.country || 'Pakistan',
                  name: place.name,
                });
              } else {
                reject(new Error(`Unable to load Google Place Details for place_id: ${placeId}`));
              }
            }
          );
        });
      }
    } catch (e) {
      console.warn('[GoogleMapsService] Legacy PlacesService details fallback failed:', e);
    }

    // Robust Karachi details fallback when Google Maps API quota is reached
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

    if (mockDetailsMap[placeId]) {
      return mockDetailsMap[placeId];
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
   * Reverse Geocodes coordinates to a LocationData object.
   */
  public async reverseGeocode(coords: MapCoordinates): Promise<LocationData> {
    await this.loadGoogleMaps();
    if (!this.geocoder && window.google?.maps) {
      this.geocoder = new window.google.maps.Geocoder();
    }

    if (!this.geocoder) {
      throw new Error('Google Geocoder service not available.');
    }

    return new Promise((resolve, reject) => {
      this.geocoder!.geocode({ location: coords }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const first = results[0];
          const parsed = this.parseAddressComponents(first.address_components);

          resolve({
            place_id: first.place_id,
            formatted_address: first.formatted_address,
            latitude: coords.lat,
            longitude: coords.lng,
            city: parsed.city,
            area: parsed.area,
            country: parsed.country,
          });
        } else {
          reject(new Error('Reverse geocoding failed.'));
        }
      });
    });
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

  private parseAddressComponents(components: google.maps.GeocoderAddressComponent[]): {
    city?: string;
    area?: string;
    country?: string;
  } {
    let city: string | undefined;
    let area: string | undefined;
    let country: string | undefined;

    for (const comp of components) {
      if (comp.types.includes('locality')) {
        city = comp.long_name;
      } else if (comp.types.includes('sublocality_level_1') || comp.types.includes('neighborhood')) {
        area = comp.long_name;
      } else if (comp.types.includes('country')) {
        country = comp.long_name;
      }
    }

    return { city, area, country };
  }
}

export const googleMapsService = new GoogleMapsService();
export default googleMapsService;

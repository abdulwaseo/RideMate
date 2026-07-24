import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { LocationData, MapCoordinates, MarkerData } from '../types/location';
import type { RouteData, VehicleType } from '../types/route';
import type { GPSLocation, TrackingStatus, PermissionStatus } from '../types/tracking';
import { googleMapsService } from '../services/googleMapsService';
import { trackingService } from '../services/trackingService';

interface MapContextType {
  mapInstance: google.maps.Map | null;
  setMapInstance: (map: google.maps.Map | null) => void;
  selectedPickup: LocationData | null;
  setSelectedPickup: (location: LocationData | null) => void;
  selectedDestination: LocationData | null;
  setSelectedDestination: (location: LocationData | null) => void;
  userLocation: MapCoordinates | null;
  isLocatingUser: boolean;
  locationPermissionError: string | null;
  requestUserLocation: () => Promise<MapCoordinates | null>;
  markers: MarkerData[];
  addMarker: (marker: MarkerData) => void;
  removeMarker: (id: string) => void;
  clearMarkers: () => void;
  centerMap: (coords: MapCoordinates, zoom?: number) => void;
  mapError: string | null;
  setMapError: (error: string | null) => void;

  // Sprint 9B Route Engine State
  currentRoute: RouteData | null;
  isCalculatingRoute: boolean;
  routeError: string | null;
  selectedVehicleType: VehicleType;
  setSelectedVehicleType: (type: VehicleType) => void;
  calculateRoute: (pickupLoc?: LocationData, destLoc?: LocationData, vType?: VehicleType) => Promise<RouteData | null>;
  selectAlternativeRoute: (routeId: string) => void;
  clearRoute: () => void;

  // Sprint 9C Live GPS & Tracking State
  driverLocation: GPSLocation | null;
  passengerLocation: GPSLocation | null;
  setPassengerLocation: (loc: GPSLocation | null) => void;
  trackingStatus: TrackingStatus;
  permissionStatus: PermissionStatus;
  gpsError: string | null;
  lastSyncTime: number | null;
  autoFollow: boolean;
  setAutoFollow: (enable: boolean) => void;
  startDriverTracking: (rideId?: string) => Promise<void>;
  stopDriverTracking: () => void;
  startPassengerTracking: (rideId: string) => void;
  requestGpsPermission: () => Promise<PermissionStatus>;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [selectedPickup, setSelectedPickupState] = useState<LocationData | null>(null);
  const [selectedDestination, setSelectedDestinationState] = useState<LocationData | null>(null);

  const setSelectedPickup = useCallback((location: LocationData | null) => {
    setSelectedPickupState(location);
    if (location && mapInstance) {
      mapInstance.panTo({ lat: location.latitude, lng: location.longitude });
      mapInstance.setZoom(15);
    }
  }, [mapInstance]);

  const setSelectedDestination = useCallback((location: LocationData | null) => {
    setSelectedDestinationState(location);
    if (location && mapInstance) {
      mapInstance.panTo({ lat: location.latitude, lng: location.longitude });
      mapInstance.setZoom(15);
    }
  }, [mapInstance]);
  const [userLocation, setUserLocation] = useState<MapCoordinates | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationPermissionError, setLocationPermissionError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

  // Sprint 9B Route Engine State
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('car');

  // Sprint 9C Tracking State
  const [driverLocation, setDriverLocation] = useState<GPSLocation | null>(null);
  const [passengerLocation, setPassengerLocation] = useState<GPSLocation | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('idle');
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [autoFollow, setAutoFollow] = useState<boolean>(true);

  const requestUserLocation = useCallback(async (): Promise<MapCoordinates | null> => {
    setIsLocatingUser(true);
    setLocationPermissionError(null);

    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser.';
      setLocationPermissionError(errorMsg);
      setIsLocatingUser(false);
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords: MapCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          setIsLocatingUser(false);

          if (mapInstance) {
            mapInstance.panTo(coords);
            mapInstance.setZoom(15);
          }

          const locationData = await googleMapsService.reverseGeocode(coords);
          if (!selectedPickup) {
            setSelectedPickup(locationData);
          }

          resolve(coords);
        },
        (error) => {
          let errorMsg = 'Failed to retrieve your location.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location permission was denied. Please enable location access in browser settings.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'Location information is currently unavailable.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Location request timed out.';
          }

          setLocationPermissionError(errorMsg);
          setIsLocatingUser(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [mapInstance, selectedPickup]);

  const addMarker = useCallback((marker: MarkerData) => {
    setMarkers((prev) => [...prev.filter((m) => m.id !== marker.id), marker]);
  }, []);

  const removeMarker = useCallback((id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  const centerMap = useCallback(
    (coords: MapCoordinates, zoom = 14) => {
      if (mapInstance) {
        mapInstance.panTo(coords);
        mapInstance.setZoom(zoom);
      }
    },
    [mapInstance]
  );

  const calculateRoute = useCallback(
    async (
      pickupLoc?: LocationData,
      destLoc?: LocationData,
      vType?: VehicleType
    ): Promise<RouteData | null> => {
      const pickup = pickupLoc || selectedPickup;
      const destination = destLoc || selectedDestination;
      const vehicle = vType || selectedVehicleType;

      if (!pickup || !destination) {
        setRouteError('Both pickup and destination locations must be selected.');
        return null;
      }

      if (pickup.latitude === destination.latitude && pickup.longitude === destination.longitude) {
        setRouteError('Pickup and Destination points cannot be identical.');
        return null;
      }

      setIsCalculatingRoute(true);
      setRouteError(null);

      try {
        const routeData = await googleMapsService.calculateRoute(pickup, destination, {
          vehicleType: vehicle,
          provideAlternatives: true,
        });

        setCurrentRoute(routeData);
        setIsCalculatingRoute(false);
        return routeData;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Route calculation failed.';
        setRouteError(message);
        setIsCalculatingRoute(false);
        return null;
      }
    },
    [selectedPickup, selectedDestination, selectedVehicleType]
  );

  const selectAlternativeRoute = useCallback(
    (routeId: string) => {
      if (!currentRoute || !currentRoute.alternative_routes) return;

      const selectedAlt = currentRoute.alternative_routes.find((alt) => alt.route_id === routeId);
      if (selectedAlt) {
        const oldPrimary = { ...currentRoute, alternative_routes: undefined };
        const newAlts = [
          oldPrimary,
          ...currentRoute.alternative_routes.filter((alt) => alt.route_id !== routeId),
        ];

        setCurrentRoute({
          ...selectedAlt,
          alternative_routes: newAlts,
        });
      }
    },
    [currentRoute]
  );

  const clearRoute = useCallback(() => {
    setCurrentRoute(null);
    setRouteError(null);
    googleMapsService.clearRoute();
  }, []);

  // Sprint 9C Live Tracking Methods
  const requestGpsPermission = useCallback(async (): Promise<PermissionStatus> => {
    const status = await trackingService.requestPermissions();
    setPermissionStatus(status);
    return status;
  }, []);

  const startDriverTracking = useCallback(async (rideId?: string) => {
    setTrackingStatus('locating');
    setGpsError(null);

    const perm = await trackingService.checkPermissions();
    setPermissionStatus(perm);

    if (perm === 'denied') {
      setTrackingStatus('error');
      setGpsError('GPS permission was denied. Please grant location access in browser settings.');
      return;
    }

    trackingService.startDriverTracking(
      rideId,
      (location) => {
        setDriverLocation(location);
        setTrackingStatus('tracking');
        setLastSyncTime(Date.now());

        if (mapInstance && autoFollow) {
          mapInstance.panTo({ lat: location.latitude, lng: location.longitude });
        }
      },
      (err) => {
        setTrackingStatus('error');
        setGpsError(err.message);
      }
    );
  }, [mapInstance, autoFollow]);

  const stopDriverTracking = useCallback(() => {
    trackingService.stopTracking();
    setTrackingStatus('stopped');
  }, []);

  const startPassengerTracking = useCallback((rideId: string) => {
    setTrackingStatus('locating');
    setGpsError(null);

    trackingService.startPassengerTracking(
      rideId,
      (record) => {
        const dLoc: GPSLocation = {
          latitude: record.latitude,
          longitude: record.longitude,
          heading: record.heading,
          speed: record.speed,
          accuracy: record.accuracy,
          timestamp: new Date(record.recorded_at).getTime(),
        };
        setDriverLocation(dLoc);
        setTrackingStatus('tracking');
        setLastSyncTime(Date.now());

        if (mapInstance && autoFollow) {
          mapInstance.panTo({ lat: dLoc.latitude, lng: dLoc.longitude });
        }
      },
      (err) => {
        setTrackingStatus('error');
        setGpsError(err.message);
      }
    );
  }, [mapInstance, autoFollow]);

  return (
    <MapContext.Provider
      value={{
        mapInstance,
        setMapInstance,
        selectedPickup,
        setSelectedPickup,
        selectedDestination,
        setSelectedDestination,
        userLocation,
        isLocatingUser,
        locationPermissionError,
        requestUserLocation,
        markers,
        addMarker,
        removeMarker,
        clearMarkers,
        centerMap,
        mapError,
        setMapError,
        currentRoute,
        isCalculatingRoute,
        routeError,
        selectedVehicleType,
        setSelectedVehicleType,
        calculateRoute,
        selectAlternativeRoute,
        clearRoute,
        driverLocation,
        passengerLocation,
        setPassengerLocation,
        trackingStatus,
        permissionStatus,
        gpsError,
        lastSyncTime,
        autoFollow,
        setAutoFollow,
        startDriverTracking,
        stopDriverTracking,
        startPassengerTracking,
        requestGpsPermission,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = (): MapContextType => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};

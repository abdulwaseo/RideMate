export interface LocationData {
  id?: string;
  place_id: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  city?: string;
  area?: string;
  country?: string;
  name?: string;
}

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export type LocationType = 'pickup' | 'destination' | 'waypoint';

export interface MarkerData {
  id: string;
  position: MapCoordinates;
  title: string;
  type: LocationType;
  location?: LocationData;
}

export interface AutocompleteSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

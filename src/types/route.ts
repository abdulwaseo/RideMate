import type { LocationData } from './location';

export type VehicleType = 'car' | 'bike' | 'suv' | 'van';

export interface FareEstimate {
  minimum_fare: number;
  recommended_fare: number;
  maximum_fare: number;
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  surge_multiplier: number;
  currency: string;
}

export interface RouteStep {
  instructions: string;
  distance_km: number;
  duration_mins: number;
}

export interface RouteData {
  route_id: string;
  pickup_location: LocationData;
  destination_location: LocationData;
  distance_km: number;
  estimated_duration: number; // in minutes
  traffic_duration?: number; // in minutes
  polyline: string;
  fare_estimate: FareEstimate;
  warnings: string[];
  alternative_routes?: RouteData[];
  steps?: RouteStep[];
}

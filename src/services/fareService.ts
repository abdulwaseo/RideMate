import type { FareEstimate, VehicleType } from '../types/route';

export interface VehicleFareConfig {
  baseFare: number; // PKR
  perKmRate: number; // PKR/km
  perMinRate: number; // PKR/min
  minFareThreshold: number; // PKR minimum trip cost
}

// Enterprise Pakistan Fare Matrix (PKR)
const FARE_CONFIG: Record<VehicleType, VehicleFareConfig> = {
  bike: {
    baseFare: 50,
    perKmRate: 20,
    perMinRate: 3,
    minFareThreshold: 80,
  },
  car: {
    baseFare: 120,
    perKmRate: 45,
    perMinRate: 6,
    minFareThreshold: 200,
  },
  suv: {
    baseFare: 180,
    perKmRate: 65,
    perMinRate: 9,
    minFareThreshold: 300,
  },
  van: {
    baseFare: 250,
    perKmRate: 85,
    perMinRate: 12,
    minFareThreshold: 450,
  },
};

class FareService {
  /**
   * Calculates intelligent fare estimation based on distance, duration, vehicle type, and surge.
   */
  public calculateFare(
    distanceKm: number,
    durationMins: number,
    vehicleType: VehicleType = 'car',
    surgeMultiplier = 1.0
  ): FareEstimate {
    // Validations
    if (distanceKm < 0 || durationMins < 0) {
      throw new Error('Distance and duration must be non-negative values.');
    }

    const config = FARE_CONFIG[vehicleType] || FARE_CONFIG.car;

    const baseFare = config.baseFare * surgeMultiplier;
    const distanceFare = distanceKm * config.perKmRate * surgeMultiplier;
    const timeFare = durationMins * config.perMinRate * surgeMultiplier;

    const rawTotal = baseFare + distanceFare + timeFare;
    const calculatedTotal = Math.max(rawTotal, config.minFareThreshold);

    // Recommended fare rounded to nearest 10 PKR
    const recommendedFare = Math.ceil(calculatedTotal / 10) * 10;
    const minimumFare = Math.max(Math.floor((recommendedFare * 0.85) / 10) * 10, config.minFareThreshold);
    const maximumFare = Math.ceil((recommendedFare * 1.25) / 10) * 10;

    return {
      minimum_fare: minimumFare,
      recommended_fare: recommendedFare,
      maximum_fare: maximumFare,
      base_fare: Math.round(baseFare),
      distance_fare: Math.round(distanceFare),
      time_fare: Math.round(timeFare),
      surge_multiplier: surgeMultiplier,
      currency: 'PKR',
    };
  }

  /**
   * Helper to retrieve vehicle fare configurations.
   */
  public getVehicleConfig(vehicleType: VehicleType): VehicleFareConfig {
    return FARE_CONFIG[vehicleType] || FARE_CONFIG.car;
  }
}

export const fareService = new FareService();
export default fareService;

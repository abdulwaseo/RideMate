// @ts-nocheck
import { googleMapsService } from '../services/googleMapsService';

describe('RouteEngine & Cache Integration Tests', () => {
  const mockPickup = {
    place_id: 'pk_khi_clifton_01',
    formatted_address: 'Clifton Beach, Karachi',
    latitude: 24.8138,
    longitude: 67.0298,
    city: 'Karachi',
    area: 'Clifton',
    country: 'Pakistan',
  };

  const mockDestination = {
    place_id: 'pk_khi_gulshan_02',
    formatted_address: 'Gulshan-e-Iqbal Block 13, Karachi',
    latitude: 24.9204,
    longitude: 67.0944,
    city: 'Karachi',
    area: 'Gulshan',
    country: 'Pakistan',
  };

  it('should calculate route with distance, ETA, polyline, and fare', async () => {
    const route = await googleMapsService.calculateRoute(mockPickup, mockDestination, { vehicleType: 'car' });
    expect(route).toBeDefined();
    expect(route.distance_km).toBeGreaterThan(0);
    expect(route.estimated_duration).toBeGreaterThan(0);
    expect(route.fare_estimate.recommended_fare).toBeGreaterThan(0);
    expect(route.polyline).toBeDefined();
  });

  it('should throw error when pickup and destination are identical', async () => {
    await expect(
      googleMapsService.calculateRoute(mockPickup, mockPickup)
    ).rejects.toThrow('Pickup and Destination locations cannot be identical.');
  });

  it('should cache route calculation in memory', async () => {
    googleMapsService.clearRoute();
    const route1 = await googleMapsService.calculateRoute(mockPickup, mockDestination, { vehicleType: 'car' });
    const route2 = await googleMapsService.calculateRoute(mockPickup, mockDestination, { vehicleType: 'car' });

    expect(route1.route_id).toBe(route2.route_id);
  });
});

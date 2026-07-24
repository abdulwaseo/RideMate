// @ts-nocheck
import { fareService } from '../services/fareService';

describe('FareService Unit Tests', () => {
  it('should calculate correct fare for car vehicle type', () => {
    const fare = fareService.calculateFare(10, 20, 'car');
    expect(fare).toBeDefined();
    expect(fare.recommended_fare).toBeGreaterThan(0);
    expect(fare.minimum_fare).toBeGreaterThanOrEqual(200);
    expect(fare.maximum_fare).toBeGreaterThan(fare.recommended_fare);
    expect(fare.currency).toBe('PKR');
  });

  it('should calculate lower fare for bike vehicle type', () => {
    const carFare = fareService.calculateFare(10, 20, 'car');
    const bikeFare = fareService.calculateFare(10, 20, 'bike');
    expect(bikeFare.recommended_fare).toBeLessThan(carFare.recommended_fare);
    expect(bikeFare.minimum_fare).toBeGreaterThanOrEqual(80);
  });

  it('should calculate higher fare for SUV and Van', () => {
    const carFare = fareService.calculateFare(15, 30, 'car');
    const suvFare = fareService.calculateFare(15, 30, 'suv');
    const vanFare = fareService.calculateFare(15, 30, 'van');

    expect(suvFare.recommended_fare).toBeGreaterThan(carFare.recommended_fare);
    expect(vanFare.recommended_fare).toBeGreaterThan(suvFare.recommended_fare);
  });

  it('should throw error on negative distance or duration', () => {
    expect(() => fareService.calculateFare(-5, 20, 'car')).toThrow();
    expect(() => fareService.calculateFare(10, -10, 'car')).toThrow();
  });
});

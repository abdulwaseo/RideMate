// @ts-nocheck
import { googleMapsService } from '../services/googleMapsService';


describe('GoogleMapsService Foundation Tests', () => {
  it('should return mock place predictions when input is provided', async () => {
    const predictions = await googleMapsService.getPlacePredictions('Clifton');
    expect(predictions).toBeDefined();
    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions[0].main_text).toContain('Clifton');
  });

  it('should return place details for valid place_id', async () => {
    const details = await googleMapsService.getPlaceDetails('pk_khi_clifton_01');
    expect(details).toBeDefined();
    expect(details.city).toBe('Karachi');
    expect(details.latitude).toBeCloseTo(24.8138);
    expect(details.longitude).toBeCloseTo(67.0298);
  });

  it('should reverse geocode coordinates correctly', async () => {
    const result = await googleMapsService.reverseGeocode({ lat: 24.8607, lng: 67.0011 });
    expect(result).toBeDefined();
    expect(result.city).toBe('Karachi');
  });

  it('should calculate estimated route preview fallback', async () => {
    const preview = await googleMapsService.calculateRoutePreview(
      { lat: 24.8138, lng: 67.0298 },
      { lat: 24.9204, lng: 67.0944 }
    );
    expect(preview.distanceKm).toBeGreaterThan(0);
    expect(preview.durationMins).toBeGreaterThan(0);
  });
});

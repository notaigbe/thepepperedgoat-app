// Jagabans L.A. Restaurant Location
// Replace with actual restaurant coordinates
export const RESTAURANT_LOCATION = {
  latitude: process.env.GEOFENCE_LATITUDE ? parseFloat(process.env.GEOFENCE_LATITUDE) : 34.0438676, // Los Angeles latitude (replace with actual)
  longitude: process.env.GEOFENCE_LONGITUDE ? parseFloat(process.env.GEOFENCE_LONGITUDE) : -118.2772777, // Los Angeles longitude (replace with actual)
  name: process.env.RESTAURANT_NAME || 'Jagabans L.A.', // Replace with actual
  address: process.env.RESTAURANT_ADDRESS || '1423 W Pico Blvd, Los Angeles, CA 90015', // Replace with actual
};

// Geofence radius in meters (e.g., 100 meters = ~328 feet)
export const GEOFENCE_RADIUS_METERS = process.env.GEOFENCE_RADIUS_METERS ? parseInt(process.env.GEOFENCE_RADIUS_METERS) : 500; // Default to 500 meters

// Alias for consistency with social features
export const JAGABANS_LOCATION = {
  latitude: RESTAURANT_LOCATION.latitude,
  longitude: RESTAURANT_LOCATION.longitude,
  radius: GEOFENCE_RADIUS_METERS,
};

// Function to calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Check if a location is within the geofence
export function isWithinGeofence(
  userLat: number,
  userLon: number
): boolean {
  const distance = calculateDistance(
    userLat,
    userLon,
    RESTAURANT_LOCATION.latitude,
    RESTAURANT_LOCATION.longitude
  );
  return distance <= GEOFENCE_RADIUS_METERS;
}

// Referral bonus configuration
export const REFERRAL_CONFIG = {
  signupBonusPoints: 500, // Points awarded when referred user signs up
  firstOrderBonusPoints: 500, // Points awarded when referred user completes first order
};

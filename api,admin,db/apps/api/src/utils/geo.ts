/**
 * Geographic utility functions
 * Calculate distance and estimated travel time between coordinates
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate travel time in minutes based on distance
 * Assumes average speed of 50 km/h in city, 80 km/h on highway
 * Uses a simple heuristic: city speed for distances < 10km, highway for longer
 */
export function estimateTravelTime(distanceKm: number): number {
  // Average speeds (km/h)
  const citySpeed = 50; // km/h
  const highwaySpeed = 80; // km/h

  // Use city speed for short distances, highway for longer
  const averageSpeed = distanceKm < 10 ? citySpeed : highwaySpeed;

  // Convert to minutes
  const timeHours = distanceKm / averageSpeed;
  const timeMinutes = Math.ceil(timeHours * 60);

  return timeMinutes;
}

/**
 * Check if driver is within specified minutes of pickup location
 */
export function isWithinMinutes(
  driverLat: number,
  driverLon: number,
  pickupLat: number,
  pickupLon: number,
  maxMinutes: number
): { within: boolean; estimatedMinutes: number; distanceKm: number } {
  if (!driverLat || !driverLon || !pickupLat || !pickupLon) {
    return { within: false, estimatedMinutes: Infinity, distanceKm: Infinity };
  }

  const distanceKm = calculateDistance(driverLat, driverLon, pickupLat, pickupLon);
  const estimatedMinutes = estimateTravelTime(distanceKm);

  return {
    within: estimatedMinutes <= maxMinutes,
    estimatedMinutes,
    distanceKm
  };
}

/**
 * Check if driver has arrived at pickup location (within 200 meters)
 */
export function hasArrived(
  driverLat: number,
  driverLon: number,
  pickupLat: number,
  pickupLon: number
): boolean {
  if (!driverLat || !driverLon || !pickupLat || !pickupLon) {
    return false;
  }

  const distanceKm = calculateDistance(driverLat, driverLon, pickupLat, pickupLon);
  const distanceMeters = distanceKm * 1000;

  // Consider arrived if within 200 meters
  return distanceMeters <= 200;
}


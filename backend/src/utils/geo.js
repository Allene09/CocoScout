/**
 * Geospatial utility functions for drone GPS coordinate calculations.
 */

// Earth's radius in meters
const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate great-circle distance between two coordinates in meters (Haversine formula)
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in meters
 */
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Get bounding box around a GPS coordinate given a radius in meters
 * Useful to narrow down SQL queries before exact spherical distance
 * @param {number} lat Center latitude
 * @param {number} lon Center longitude
 * @param {number} radiusMeters Radius in meters
 * @returns {{ minLat: number, maxLat: number, minLon: number, maxLon: number }}
 */
function getBoundingBox(lat, lon, radiusMeters) {
  // 1 degree latitude ~ 111,320 meters
  const deltaLat = radiusMeters / 111320;
  // 1 degree longitude ~ 111,320 * cos(lat) meters
  const deltaLon = radiusMeters / (111320 * Math.cos(toRadians(lat)) || 1);

  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLon: lon - deltaLon,
    maxLon: lon + deltaLon,
  };
}

module.exports = {
  haversineDistanceMeters,
  getBoundingBox,
};

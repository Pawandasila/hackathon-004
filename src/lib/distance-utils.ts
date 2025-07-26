/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  
  // Convert degrees to radians
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in kilometers
  const distance = R * c;
  
  return distance;
}

/**
 * Sort listings by distance from user location
 * @param listings Array of listings with coordinates
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @returns Sorted array of listings with distance property
 */
export function sortListingsByDistance<T extends { latitude?: number; longitude?: number }>(
  listings: T[],
  userLat: number,
  userLon: number
): (T & { distance: number | null })[] {
  return listings
    .map(listing => ({
      ...listing,
      distance: listing.latitude && listing.longitude
        ? calculateDistance(userLat, userLon, listing.latitude, listing.longitude)
        : null
    }))
    .sort((a, b) => {
      // If both have distances, sort by distance
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      // If only one has distance, prioritize it
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      // If neither has distance, maintain original order
      return 0;
    });
}
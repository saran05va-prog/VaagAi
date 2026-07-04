/**
 * District-level lat/lng lookup table for nearest-market queries.
 * This avoids live geocoding entirely — every district in our coverage
 * area has a pre-seeded coordinate.
 *
 * Coordinates are approximate district centroids, sufficient for
 * "nearest reporting market" ranking.
 */

interface DistrictCoord {
  state: string
  district: string
  lat: number
  lng: number
}

// Tamil Nadu (primary coverage) + neighbouring states
const COORDS: DistrictCoord[] = [
  // Tamil Nadu
  { state: 'Tamil Nadu', district: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { state: 'Tamil Nadu', district: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { state: 'Tamil Nadu', district: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047 },
  { state: 'Tamil Nadu', district: 'Salem', lat: 11.6643, lng: 78.1460 },
  { state: 'Tamil Nadu', district: 'Erode', lat: 11.3410, lng: 77.7172 },
  { state: 'Tamil Nadu', district: 'Tirunelveli', lat: 8.7139, lng: 77.7567 },
  { state: 'Tamil Nadu', district: 'Vellore', lat: 12.9165, lng: 79.1325 },
  { state: 'Tamil Nadu', district: 'Thanjavur', lat: 10.7870, lng: 79.1378 },
  { state: 'Tamil Nadu', district: 'Dindigul', lat: 10.3673, lng: 77.9803 },
  { state: 'Tamil Nadu', district: 'Tiruppur', lat: 11.1085, lng: 77.3411 },
  { state: 'Tamil Nadu', district: 'Kanyakumari', lat: 8.0883, lng: 77.5385 },
  { state: 'Tamil Nadu', district: 'Cuddalore', lat: 11.7460, lng: 79.7624 },
  { state: 'Tamil Nadu', district: 'Nagapattinam', lat: 10.7661, lng: 79.8420 },
  { state: 'Tamil Nadu', district: 'Sivaganga', lat: 9.8436, lng: 78.4840 },
  { state: 'Tamil Nadu', district: 'Virudhunagar', lat: 9.5603, lng: 77.9579 },
  { state: 'Tamil Nadu', district: 'Theni', lat: 10.0104, lng: 77.4768 },
  { state: 'Tamil Nadu', district: 'Namakkal', lat: 11.2210, lng: 78.1650 },
  { state: 'Tamil Nadu', district: 'Karur', lat: 10.9500, lng: 78.0833 },
  { state: 'Tamil Nadu', district: 'Perambalur', lat: 11.2333, lng: 78.8833 },
  { state: 'Tamil Nadu', district: 'Ariyalur', lat: 11.1394, lng: 79.0833 },
  // Karnataka
  { state: 'Karnataka', district: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { state: 'Karnataka', district: 'Mysore', lat: 12.2958, lng: 76.6394 },
  { state: 'Karnataka', district: 'Hubli', lat: 15.3647, lng: 75.1240 },
  { state: 'Karnataka', district: 'Belgaum', lat: 15.8497, lng: 74.4977 },
  { state: 'Karnataka', district: 'Mangalore', lat: 12.9141, lng: 74.8560 },
  { state: 'Karnataka', district: 'Davanagere', lat: 14.4644, lng: 75.9218 },
  // Kerala
  { state: 'Kerala', district: 'Palakkad', lat: 10.7867, lng: 76.6548 },
  { state: 'Kerala', district: 'Thrissur', lat: 10.5276, lng: 76.2144 },
  { state: 'Kerala', district: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
  { state: 'Kerala', district: 'Ernakulam', lat: 10.0155, lng: 76.3419 },
  // Andhra Pradesh
  { state: 'Andhra Pradesh', district: 'Chittoor', lat: 13.2172, lng: 79.1003 },
  { state: 'Andhra Pradesh', district: 'Nellore', lat: 14.4426, lng: 79.9865 },
  { state: 'Andhra Pradesh', district: 'Kurnool', lat: 15.8281, lng: 78.0373 },
  // Telangana
  { state: 'Telangana', district: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { state: 'Telangana', district: 'Warangal', lat: 17.9689, lng: 79.5941 },
  // Maharashtra
  { state: 'Maharashtra', district: 'Pune', lat: 18.5204, lng: 73.8567 },
  { state: 'Maharashtra', district: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { state: 'Maharashtra', district: 'Nashik', lat: 19.9975, lng: 73.7898 },
  { state: 'Maharashtra', district: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  // Punjab
  { state: 'Punjab', district: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
  { state: 'Punjab', district: 'Amritsar', lat: 31.6340, lng: 74.8723 },
  // Gujarat
  { state: 'Gujarat', district: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { state: 'Gujarat', district: 'Surat', lat: 21.1702, lng: 72.8311 },
  // Madhya Pradesh
  { state: 'Madhya Pradesh', district: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { state: 'Madhya Pradesh', district: 'Indore', lat: 22.7196, lng: 75.8577 },
  // Uttar Pradesh
  { state: 'Uttar Pradesh', district: 'Kanpur', lat: 26.4499, lng: 80.3319 },
  { state: 'Uttar Pradesh', district: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  // West Bengal
  { state: 'West Bengal', district: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { state: 'West Bengal', district: 'Howrah', lat: 22.5958, lng: 88.2636 },
]

const lookupMap = new Map<string, DistrictCoord>()
for (const c of COORDS) {
  lookupMap.set(`${c.state.toLowerCase()}|${c.district.toLowerCase()}`, c)
}

export function getDistrictCoord(state: string, district: string): DistrictCoord | null {
  return lookupMap.get(`${state.toLowerCase()}|${district.toLowerCase()}`) || null
}

/**
 * Haversine distance in km between two lat/lng points.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Find the nearest district coordinate to a given lat/lng.
 */
export function findNearestDistrict(lat: number, lng: number): { coord: DistrictCoord; distanceKm: number } | null {
  let nearest: DistrictCoord | null = null
  let minDist = Infinity
  for (const c of COORDS) {
    const dist = haversineKm(lat, lng, c.lat, c.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = c
    }
  }
  return nearest ? { coord: nearest, distanceKm: minDist } : null
}

export default COORDS

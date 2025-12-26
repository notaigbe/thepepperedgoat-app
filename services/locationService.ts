
/**
 * Service for getting IP address and location information
 */

import * as Network from 'expo-network';

export interface LocationInfo {
  ipAddress: string;
  city?: string;
  state?: string;
  country?: string;
}

/**
 * Get the device's IP address and location information
 * Uses ipapi.co for geolocation based on IP
 */
export async function getIpAndLocation(): Promise<LocationInfo> {
  try {
    // Get IP address
    const ipAddress = await Network.getIpAddressAsync();
    console.log('Device IP address:', ipAddress);

    // Get location info from IP
    // Using ipapi.co free API (no key required, 1000 requests/day)
    try {
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const data = await response.json();

      if (data.error) {
        console.warn('IP geolocation error:', data.reason);
        return {
          ipAddress,
          city: undefined,
          state: undefined,
          country: undefined,
        };
      }

      return {
        ipAddress,
        city: data.city || undefined,
        state: data.region || undefined,
        country: data.country_name || undefined,
      };
    } catch (geoError) {
      console.warn('Failed to get location from IP:', geoError);
      return {
        ipAddress,
        city: undefined,
        state: undefined,
        country: undefined,
      };
    }
  } catch (error) {
    console.error('Failed to get IP address:', error);
    // Return a fallback
    return {
      ipAddress: 'Unknown',
      city: undefined,
      state: undefined,
      country: undefined,
    };
  }
}

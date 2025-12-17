import * as Location from 'expo-location';
import type { LocationData } from '../types';

let locationSubscription: Location.LocationSubscription | null = null;

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('⚠️ Location permission denied');
      return false;
    }
    
    console.log('✅ Location permission granted');
    return true;
  } catch (error) {
    console.error('❌ Error requesting location permission:', error);
    return false;
  }
}

/**
 * Start tracking user location
 */
export async function startLocationTracking(
  callback: (location: LocationData) => void
): Promise<boolean> {
  try {
    // Request permission first
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.warn('⚠️ Location permission not granted');
      return false;
    }

    // Stop existing subscription if any
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    console.log('🔄 Starting location tracking...');

    // Start watching position
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced, // Changed from High to Balanced for better stability
        timeInterval: 5000, // Increased from 2000 to 5000ms for iOS stability
        distanceInterval: 20, // Increased from 10 to 20 meters
        mayShowUserSettingsDialog: true,
      },
      (position) => {
        try {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed, // m/s
            heading: position.coords.heading,
            accuracy: position.coords.accuracy ?? 0,
            timestamp: position.timestamp,
          };
          
          callback(locationData);
        } catch (error) {
          console.error('❌ Error in location callback:', error);
        }
      }
    );

    console.log('✅ Location tracking started');
    return true;
  } catch (error) {
    console.error('❌ Error starting location tracking:', error);
    
    // If watch fails, try to get current position at least
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
        accuracy: position.coords.accuracy ?? 0,
        timestamp: position.timestamp,
      };
      
      callback(locationData);
      console.log('✅ Got initial location (watch failed, using single position)');
    } catch (fallbackError) {
      console.error('❌ Fallback location also failed:', fallbackError);
    }
    
    return false;
  }
}

/**
 * Stop location tracking
 */
export function stopLocationTracking(): void {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
    console.log('🛑 Location tracking stopped');
  }
}

/**
 * Get current location once
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: position.coords.speed,
      heading: position.coords.heading,
      accuracy: position.coords.accuracy ?? 0,
      timestamp: position.timestamp,
    };
  } catch (error) {
    console.error('❌ Error getting current location:', error);
    return null;
  }
}

/**
 * Calculate speed in km/h from m/s
 */
export function calculateSpeedKmh(speedMs: number | null): number {
  if (speedMs === null || speedMs < 0) {
    return 0;
  }
  
  // Convert m/s to km/h
  const speedKmh = speedMs * 3.6;
  
  // Round to 1 decimal place
  return Math.round(speedKmh * 10) / 10;
}

/**
 * Get address from coordinates (reverse geocoding)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses.length > 0) {
      const address = addresses[0];
      const parts = [
        address.street,
        address.city,
        address.region,
        address.country,
      ].filter(Boolean);
      
      return parts.join(', ') || 'Unknown location';
    }

    return 'Unknown location';
  } catch (error) {
    console.error('❌ Error reverse geocoding:', error);
    return 'Unknown location';
  }
}
// src/hooks/useLocation.js
import * as Location from "expo-location";
import { useEffect, useState } from "react";

/**
 * Custom React hook for requesting GPS permissions and tracking live user location.
 *
 * @returns {object} { location, errorMsg, isLoading, permissionGranted }
 * - location: { latitude, longitude, accuracy, heading } | null
 * - errorMsg: string | null
 * - isLoading: boolean
 * - permissionGranted: boolean
 */
export function useLocation() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    let subscription = null;
    let isMounted = true;

    async function startLocationTracking() {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        // 1. Request foreground location permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        // Check if unmounted while waiting for permission prompt
        if (!isMounted) return;

        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied.");
          setPermissionGranted(false);
          setIsLoading(false);
          return;
        }

        setPermissionGranted(true);

        // 2. Get initial position immediately
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Check if unmounted while waiting for initial position
        if (!isMounted) return;

        if (initialLocation?.coords) {
          setLocation({
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
            accuracy: initialLocation.coords.accuracy,
            heading: initialLocation.coords.heading,
          });
          setIsLoading(false);
        }

        // 3. Start watching for real-time location changes
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000, // Update position every 3 seconds
            distanceInterval: 5, // Update position every 5 meters moved
          },
          (newLocation) => {
            if (isMounted && newLocation?.coords) {
              setLocation({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                accuracy: newLocation.coords.accuracy,
                heading: newLocation.coords.heading,
              });
              setIsLoading(false);
            }
          }
        );

        // Check if unmounted while watchPositionAsync was resolving
        if (!isMounted) {
          sub.remove();
          return;
        }

        subscription = sub;
      } catch (error) {
        if (isMounted) {
          setErrorMsg(error.message || "Failed to fetch GPS location.");
          setIsLoading(false);
        }
      }
    }

    startLocationTracking();

    // 4. Cleanup subscription when the component unmounts
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return {
    location,
    errorMsg,
    isLoading,
    permissionGranted,
  };
}

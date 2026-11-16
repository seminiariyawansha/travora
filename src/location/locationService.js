// src/location/locationService.js
import * as Location from "expo-location";
import { getActiveLocation } from "./devLocationSimulator";

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function getCurrentLocation() {
  // In dev, a simulated location (set via devLocationSimulator) always wins —
  // this is what lets us fake GPS movement for the demo.
  const simulated = getActiveLocation();
  if (simulated) return simulated;

  const location = await Location.getCurrentPositionAsync({});
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude
  };
}

export function watchLocation(onUpdate) {
  let subscription;

  Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
    (location) => {
      const simulated = getActiveLocation();
      if (simulated) {
        onUpdate(simulated);
      } else {
        onUpdate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
    }
  ).then((sub) => {
    subscription = sub;
  });

  // call the returned function to stop watching
  return () => {
    if (subscription) subscription.remove();
  };
}

// src/location/devLocationSimulator.js
// DEV-ONLY TOOL: lets us fake GPS coordinates for demos and testing.
// Real users never see or use this — it's for your team's admin/debug screen only.

let simulatedLocation = null;

export function setSimulatedLocation(latitude, longitude) {
  simulatedLocation = { latitude, longitude };
}

export function clearSimulatedLocation() {
  simulatedLocation = null;
}

export function getActiveLocation() {
  return simulatedLocation;
}

// Handy for the demo: move the simulated point a fraction of the way
// toward a target each time this is called, so you can show the
// distance count down live instead of jumping straight to 0m.
export function stepTowards(targetLat, targetLon, fraction = 0.3) {
  if (!simulatedLocation) {
    simulatedLocation = { latitude: targetLat, longitude: targetLon };
    return simulatedLocation;
  }
  simulatedLocation = {
    latitude:
      simulatedLocation.latitude +
      (targetLat - simulatedLocation.latitude) * fraction,
    longitude:
      simulatedLocation.longitude +
      (targetLon - simulatedLocation.longitude) * fraction
  };
  return simulatedLocation;
}

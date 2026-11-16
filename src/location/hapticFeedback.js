// src/location/hapticFeedback.js
import * as Haptics from "expo-haptics";

// Call this repeatedly as location updates come in, while a point is locked.
// The closer the user gets, the stronger/more frequent the pulse feels.
export async function pulseForProximity(distanceMeters, radiusMeters) {
  if (distanceMeters <= radiusMeters) return; // already unlocked, no need to pulse

  if (distanceMeters < radiusMeters * 2) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } else if (distanceMeters < radiusMeters * 5) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } else if (distanceMeters < radiusMeters * 10) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  // beyond that range, no pulse — too far to bother
}

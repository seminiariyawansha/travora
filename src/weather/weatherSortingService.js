// src/weather/weatherSortingService.js

/**
 * Sorts tourist points based on current weather conditions.
 *
 * When raining:
 * - Prioritizes indoor-friendly points (placed first).
 * - Sets suggested: true for indoor points and suggested: false for outdoor points.
 *
 * When not raining:
 * - Prioritizes outdoor points (placed first).
 * - Sets suggested: true for outdoor points and suggested: false for indoor points.
 *
 * When weather is unavailable, null, or undefined:
 * - Preserves original point order.
 * - Sets suggested: false for all points.
 *
 * @param {Array} points - Array of tourist point objects
 * @param {object|null} weatherInfo - Weather object containing { isRaining }
 * @returns {Array} New sorted array with updated `suggested` flag for each point
 */
export function sortPointsByWeather(points, weatherInfo) {
  if (!Array.isArray(points) || points.length === 0) {
    return [];
  }

  try {
    // If weather is unavailable or missing isRaining boolean property
    if (!weatherInfo || typeof weatherInfo.isRaining !== "boolean") {
      return points.map((point) => ({
        ...point,
        suggested: false,
      }));
    }

    const isRaining = weatherInfo.isRaining;

    // Helper to evaluate indoor-friendly status cleanly
    const isIndoor = (point) => Boolean(point?.indoorFriendly);

    if (isRaining) {
      // Prioritize indoor-friendly points when raining
      const indoorPoints = [];
      const outdoorPoints = [];

      for (const point of points) {
        if (isIndoor(point)) {
          indoorPoints.push({ ...point, suggested: true });
        } else {
          outdoorPoints.push({ ...point, suggested: false });
        }
      }

      return [...indoorPoints, ...outdoorPoints];
    } else {
      // Prioritize outdoor points when clear/sunny
      const outdoorPoints = [];
      const indoorPoints = [];

      for (const point of points) {
        if (!isIndoor(point)) {
          outdoorPoints.push({ ...point, suggested: true });
        } else {
          indoorPoints.push({ ...point, suggested: false });
        }
      }

      return [...outdoorPoints, ...indoorPoints];
    }
  } catch (error) {
    console.error("Error sorting points by weather:", error?.message || error);
    // Return safe fallback preserving points with suggested: false
    return points.map((point) => ({
      ...point,
      suggested: false,
    }));
  }
}

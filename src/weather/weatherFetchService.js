// src/weather/weatherFetchService.js
import { isOnlineNow } from "../db/networkService";
import { getCachedWeather, setCachedWeather } from "./weatherCacheService";
import { getWeather } from "../../services/weatherService";

/**
 * Fetches weather for a destination using live OpenWeather API when online,
 * with SQLite fallback when offline or on API request failure.
 *
 * @param {string} destinationId - Unique identifier of the destination
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<object|null>} Weather object including { condition, isRaining, temperature, fetchedAt, isStale } or null
 */
export async function getWeatherForDestination(
  destinationId,
  latitude,
  longitude
) {
  try {
    const online = await isOnlineNow();

    if (online) {
      try {
        const liveWeather = await getWeather(latitude, longitude);

        if (liveWeather) {
          // Attempt caching, but if caching fails, still return live weather
          try {
            await setCachedWeather(destinationId, liveWeather);
          } catch (cacheError) {
            console.warn(
              `Failed to cache weather for destination "${destinationId}":`,
              cacheError?.message || cacheError
            );
          }

          return {
            ...liveWeather,
            isStale: false,
          };
        }
      } catch (apiError) {
        console.warn(
          `Weather API request failed for destination "${destinationId}". Falling back to SQLite cache.`,
          apiError?.message || apiError
        );
      }
    }

    // Fallback to local SQLite cache if offline or API failed
    const cachedWeather = await getCachedWeather(destinationId);
    if (cachedWeather) {
      return {
        ...cachedWeather,
        isStale: true,
      };
    }

    return null;
  } catch (error) {
    console.error(
      `Unexpected error in getWeatherForDestination for "${destinationId}":`,
      error?.message || error
    );
    return null;
  }
}

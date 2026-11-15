// src/weather/weatherFetchService.js
import { isOnlineNow } from "../db/networkService";
import { getCachedWeather, setCachedWeather } from "./weatherCacheService";
import { getWeather } from "../../services/weatherService";

const CACHE_FRESHNESS_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Checks if a fetchedAt timestamp string is within the 15-minute freshness threshold.
 *
 * @param {string} fetchedAt - ISO timestamp string
 * @returns {boolean} True if timestamp is valid and less than 15 minutes old
 */
function isCacheFresh(fetchedAt) {
  if (!fetchedAt) return false;
  const fetchedTime = new Date(fetchedAt).getTime();
  if (isNaN(fetchedTime)) return false;
  const now = Date.now();
  return now - fetchedTime < CACHE_FRESHNESS_MS && now >= fetchedTime;
}

/**
 * Fetches weather for a destination using live OpenWeather API when online,
 * with 15-minute SQLite cache reuse and offline fallback.
 *
 * @param {string} destinationId - Unique identifier of the destination
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<object|null>} Weather object including { condition, isRaining, temperature, fetchedAt, isStale, isCached, source } or null
 */
export async function getWeatherForDestination(
  destinationId,
  latitude,
  longitude
) {
  try {
    // 1. Retrieve local SQLite cache
    const cachedWeather = await getCachedWeather(destinationId);

    // 2. Reuse cache if it is less than 15 minutes old (no network call needed)
    if (cachedWeather && isCacheFresh(cachedWeather.fetchedAt)) {
      return {
        ...cachedWeather,
        isStale: false, // Fresh within 15 minutes
        isCached: true,
        source: "cache",
      };
    }

    // 3. Otherwise, check internet connectivity to attempt a live fetch
    const online = await isOnlineNow();

    if (online) {
      try {
        const liveWeather = await getWeather(latitude, longitude);

        if (liveWeather) {
          // Attempt caching live weather in SQLite
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
            isCached: false,
            source: "api",
          };
        }
      } catch (apiError) {
        console.warn(
          `Weather API request failed for destination "${destinationId}". Falling back to SQLite cache.`,
          apiError?.message || apiError
        );
      }
    }

    // 4. Fallback to existing SQLite cache if offline or API failed (older than 15 mins)
    if (cachedWeather) {
      return {
        ...cachedWeather,
        isStale: true, // Cache is older than 15 minutes or offline fallback
        isCached: true,
        source: "cache",
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

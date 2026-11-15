// src/weather/weatherCacheService.js
import { getDb } from "../db/database";

/**
 * Retrieves the cached weather record for a specific destination from SQLite.
 *
 * @param {string} destinationId - Unique identifier of the destination
 * @returns {Promise<object|null>} Weather object or null if not found
 */
export async function getCachedWeather(destinationId) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    "SELECT * FROM cached_weather WHERE destinationId = ?",
    [destinationId]
  );

  if (!row) {
    return null;
  }

  return {
    condition: row.condition,
    isRaining: Boolean(row.isRaining),
    temperature: row.temperature,
    fetchedAt: row.fetchedAt,
  };
}

/**
 * Saves or updates weather information for a destination in the SQLite cached_weather table.
 *
 * @param {string} destinationId - Unique identifier of the destination
 * @param {object} weather - Object containing { condition, isRaining, temperature, fetchedAt }
 * @returns {Promise<void>}
 */
export async function setCachedWeather(destinationId, weather) {
  const db = await getDb();
  const { condition, isRaining, temperature, fetchedAt } = weather || {};

  await db.runAsync(
    `INSERT OR REPLACE INTO cached_weather (destinationId, condition, isRaining, temperature, fetchedAt)
     VALUES (?, ?, ?, ?, ?)`,
    [
      destinationId,
      condition ?? "Unknown",
      isRaining ? 1 : 0,
      temperature ?? null,
      fetchedAt || new Date().toISOString(),
    ]
  );
}

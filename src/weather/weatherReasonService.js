// src/weather/weatherReasonService.js

/**
 * Generates an explanation for why an individual tourist point is recommended or not,
 * based on current or cached weather conditions.
 *
 * @param {object|null} point - Tourist point object with { indoorFriendly, suggested }
 * @param {object|null} weatherInfo - Weather object with { isRaining, isStale }
 * @returns {string|null} Explanation message or null if weather is unavailable
 */
export function getPointWeatherReason(point, weatherInfo) {
  if (!point || !weatherInfo || typeof weatherInfo.isRaining !== "boolean") {
    return null;
  }

  const isRaining = weatherInfo.isRaining;
  const isIndoor = Boolean(point.indoorFriendly);
  const isSuggested = Boolean(point.suggested);
  const isStale = Boolean(weatherInfo.isStale);

  let explanation = "";

  if (isRaining) {
    if (isIndoor && isSuggested) {
      explanation =
        "Recommended because this location is indoor-friendly during rainy weather.";
    } else {
      explanation =
        "This location is available, but indoor locations are recommended due to rain.";
    }
  } else {
    if (!isIndoor && isSuggested) {
      explanation =
        "Recommended because this location is suitable for outdoor activities in the current weather.";
    } else {
      explanation =
        "This location is available, but outdoor locations are recommended in the current weather.";
    }
  }

  if (isStale) {
    explanation += " (Using cached weather data)";
  }

  return explanation;
}

/**
 * Generates a general weather explanation message for the WeatherBanner component.
 *
 * @param {object|null} weatherInfo - Weather object with { isRaining, isStale }
 * @returns {string|null} Banner message text or null if weather is unavailable
 */
export function getBannerWeatherReason(weatherInfo) {
  if (!weatherInfo || typeof weatherInfo.isRaining !== "boolean") {
    return null;
  }

  const isRaining = weatherInfo.isRaining;
  const isStale = Boolean(weatherInfo.isStale);

  let explanation = "";

  if (isRaining) {
    explanation = "Rain expected – indoor-friendly points are suggested.";
  } else {
    explanation =
      "Weather conditions are suitable for outdoor activities – outdoor points are suggested.";
  }

  if (isStale) {
    explanation += " (Using cached weather data)";
  }

  return explanation;
}

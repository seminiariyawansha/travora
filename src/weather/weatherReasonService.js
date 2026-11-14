// src/weather/weatherReasonService.js
import { Alert, Platform } from "react-native";

/**
 * Generates an explanation for why an individual tourist point is recommended or not,
 * based on current or cached weather conditions.
 *
 * @param {object|null} point - Tourist point object with { indoorFriendly, suggested }
 * @param {object|null} weatherInfo - Weather object with { isRaining, isStale, isCached }
 * @returns {string|null} Explanation message or null if weather is unavailable
 */
export function getPointWeatherReason(point, weatherInfo) {
  if (!point || !weatherInfo || typeof weatherInfo.isRaining !== "boolean") {
    return null;
  }

  const isRaining = weatherInfo.isRaining;
  const isIndoor = Boolean(point.indoorFriendly);
  const isSuggested = Boolean(point.suggested);
  const isCached = Boolean(
    weatherInfo.isCached || weatherInfo.isStale || weatherInfo.source === "cache"
  );

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

  if (isCached) {
    explanation += " (Using cached weather data)";
  }

  return explanation;
}

/**
 * Generates a general weather explanation message for the WeatherBanner component.
 *
 * @param {object|null} weatherInfo - Weather object with { isRaining, isStale, isCached }
 * @returns {string|null} Banner message text or null if weather is unavailable
 */
export function getBannerWeatherReason(weatherInfo) {
  if (!weatherInfo || typeof weatherInfo.isRaining !== "boolean") {
    return null;
  }

  const isRaining = weatherInfo.isRaining;
  const isCached = Boolean(
    weatherInfo.isCached || weatherInfo.isStale || weatherInfo.source === "cache"
  );

  let explanation = "";

  if (isRaining) {
    explanation = "Rain expected – indoor-friendly points are suggested.";
  } else {
    explanation =
      "Weather conditions are suitable for outdoor activities – outdoor points are suggested.";
  }

  if (isCached) {
    explanation += " (Using cached weather data)";
  }

  return explanation;
}

/**
 * Generates detailed explanation text for the "Why this order?" popup dialog.
 *
 * @param {object|null} weatherInfo - Weather object with { isRaining, isStale, isCached, condition, temperature }
 * @returns {object} Object containing { title, message }
 */
export function getWeatherExplanationDetail(weatherInfo) {
  if (!weatherInfo || typeof weatherInfo.isRaining !== "boolean") {
    return {
      title: "Weather Recommendation",
      message:
        "Weather information is currently unavailable. Tourist points are displayed in standard default order.",
    };
  }

  const { isRaining, condition, temperature } = weatherInfo;
  const isCached = Boolean(
    weatherInfo.isCached || weatherInfo.isStale || weatherInfo.source === "cache"
  );

  let message = "";

  if (isRaining) {
    message =
      "Rain is expected in this area. We prioritize indoor-friendly tourist points (such as museums and sheltered sites) so you can enjoy your visit despite the rain.";
  } else {
    message =
      "Weather conditions are clear and suitable for outdoor activities. Outdoor tourist points (such as rock viewpoints and landscaped gardens) are prioritized for the best experience.";
  }

  if (temperature != null) {
    message += `\n\nCurrent Temperature: ${temperature}°C (${condition || "Clear"}).`;
  }

  if (isCached) {
    message += "\n\nNote: This recommendation is based on cached weather data.";
  }

  return {
    title: "Why This Order?",
    message,
  };
}

/**
 * Displays a cross-platform alert dialog explaining the weather recommendation ordering.
 * Supports iOS, Android (via Alert.alert), and Web (via window.alert / Alert fallback).
 *
 * @param {object|null} weatherInfo - Weather object with { isRaining, isStale, isCached, condition, temperature }
 */
export function showWeatherExplanationAlert(weatherInfo) {
  const detail = getWeatherExplanationDetail(weatherInfo);

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.alert) {
      window.alert(`${detail.title}\n\n${detail.message}`);
    } else {
      Alert.alert(detail.title, detail.message);
    }
  } else {
    Alert.alert(detail.title, detail.message);
  }
}

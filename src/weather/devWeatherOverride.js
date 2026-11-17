// src/weather/devWeatherOverride.js
// DEV-ONLY TOOL: forces the weather to "rain" or "clear" for demos and testing.
// null means "use the real weather".

let override = null;

export function setWeatherOverride(mode) {
  override = mode; // "rain" | "clear" | null
}

export function getWeatherOverride() {
  return override;
}

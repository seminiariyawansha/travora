const OPENWEATHER_API_KEY =
  process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

export async function getWeather(latitude, longitude) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;

  const response = await fetch(url);
  const data = await response.json();

  const conditionMain = data.weather?.[0]?.main ?? "Unknown";
  const isRaining = conditionMain.toLowerCase().includes("rain");

  return {
    condition: conditionMain,
    isRaining,
    temperature: data.main?.temp ?? null,
    fetchedAt: new Date().toISOString()
  };
}
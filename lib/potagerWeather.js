/** WMO weather codes with rain (drizzle, rain, showers, thunderstorm). */
const RAIN_CODES = new Set([
  51, 52, 53, 54, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

export function weatherEmoji(code) {
  if (code == null) return "🌡️";
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (RAIN_CODES.has(code)) return "🌧️";
  return "🌡️";
}

export function isRainy(forecast) {
  const precipNow = forecast.current?.precipitation ?? 0;
  const precipDay = forecast.daily?.precipitation_sum?.[0] ?? 0;
  const currentCode = forecast.current?.weather_code;
  const dayCode = forecast.daily?.weather_code?.[0];
  return (
    precipNow > 0 ||
    precipDay >= 0.5 ||
    RAIN_CODES.has(currentCode) ||
    RAIN_CODES.has(dayCode)
  );
}

export function isFrosty(forecast) {
  const min = forecast.daily?.temperature_2m_min?.[0];
  return min != null && min <= 0;
}

export function isSunny(forecast) {
  const code = forecast.current?.weather_code;
  return code === 0 || code === 1;
}

/** Priority: frost → rain → sun */
export function getGardenAdviceType(forecast) {
  if (isFrosty(forecast)) return "frost";
  if (isRainy(forecast)) return "rain";
  if (isSunny(forecast)) return "sun";
  return null;
}

function pickDailyValue(values, index = 0) {
  if (!Array.isArray(values) || !values.length) return null;
  if (values.length > 1) return values[index] ?? values[values.length - 1];
  return values[0];
}

function sliceDailySeries(values, index = 0) {
  const value = pickDailyValue(values, index);
  return value != null ? [value] : values;
}

export function parseWeatherApiResponse(data) {
  const precipDaily = data.daily?.precipitation_sum;
  const hasPastDay = Array.isArray(precipDaily) && precipDaily.length > 1;
  const todayIndex = hasPastDay ? 1 : 0;
  const yesterdayPrecip = hasPastDay ? precipDaily[0] : null;

  return {
    current: {
      temperature_2m: data.current?.temperature_2m,
      weather_code: data.current?.weather_code,
      precipitation: data.current?.precipitation,
    },
    daily: {
      temperature_2m_max: sliceDailySeries(data.daily?.temperature_2m_max, todayIndex),
      temperature_2m_min: sliceDailySeries(data.daily?.temperature_2m_min, todayIndex),
      precipitation_sum: sliceDailySeries(data.daily?.precipitation_sum, todayIndex),
      weather_code: sliceDailySeries(data.daily?.weather_code, todayIndex),
    },
    yesterdayPrecipitation: yesterdayPrecip,
  };
}

// Клиент Open-Meteo (https://open-meteo.com). API бесплатный для
// некоммерческого использования, ключ не нужен, CORS разрешён — запросы
// идут прямо из браузера. Данные распространяются по лицензии CC BY 4.0,
// поэтому в интерфейсе показываем ссылку на источник.

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
// AIR_QUALITY: отключено, пока не нужно. Чтобы вернуть — раскомментировать все
// блоки с пометкой AIR_QUALITY (здесь, в measurementForm.types.ts и MeasurementForm.tsx).
// const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

export interface OpenMeteoSnapshot {
    // Момент, к которому относятся данные (ISO, UTC).
    time: string | null;

    temperature: number | null; // °C
    humidity: number | null; // %
    pressure: number | null; // гПа (давление на уровне поверхности)
    windSpeed: number | null; // м/с
    windDirectionDegrees: number | null; // 0–360°, откуда дует ветер
    precipitation: number | null; // мм (за предыдущий час)

    // AIR_QUALITY: качество воздуха (CAMS), мкг/м³. Может отсутствовать для точки.
    // pm25: number | null;
    // pm10: number | null;
    // co: number | null;
    // no2: number | null;
    // so2: number | null;
    //
    // airQualityAvailable: boolean;
}

interface WeatherResponse {
    current?: {
        time?: string;
        temperature_2m?: number | null;
        relative_humidity_2m?: number | null;
        surface_pressure?: number | null;
        wind_speed_10m?: number | null;
        wind_direction_10m?: number | null;
        precipitation?: number | null;
    };
}

// AIR_QUALITY
// interface AirQualityResponse {
//     current?: {
//         pm2_5?: number | null;
//         pm10?: number | null;
//         carbon_monoxide?: number | null;
//         nitrogen_dioxide?: number | null;
//         sulphur_dioxide?: number | null;
//     };
// }

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`Open-Meteo вернул ошибку HTTP ${response.status}`);
    }

    return (await response.json()) as T;
}

function num(value: number | null | undefined): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function fetchOpenMeteoSnapshot(
    latitude: number,
    longitude: number,
    signal?: AbortSignal
): Promise<OpenMeteoSnapshot> {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("У локации нет корректных координат.");
    }

    const coords = `latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}`;

    // timezone=GMT — время в ответе в UTC, потом переводим в локальное время браузера.
    const weatherUrl =
        `${FORECAST_URL}?${coords}` +
        `&current=temperature_2m,relative_humidity_2m,surface_pressure,` +
        `wind_speed_10m,wind_direction_10m,precipitation` +
        `&wind_speed_unit=ms&timezone=GMT`;

    // AIR_QUALITY
    // const airUrl =
    //     `${AIR_QUALITY_URL}?${coords}` +
    //     `&current=pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide` +
    //     `&timezone=GMT`;
    //
    // const [weatherResult, airResult] = await Promise.allSettled([
    //     getJson<WeatherResponse>(weatherUrl, signal),
    //     getJson<AirQualityResponse>(airUrl, signal),
    // ]);
    //
    // // Без погоды смысла в кнопке нет — считаем это ошибкой.
    // if (weatherResult.status === "rejected") {
    //     throw weatherResult.reason;
    // }
    //
    // const w = weatherResult.value.current;

    const weather = await getJson<WeatherResponse>(weatherUrl, signal);
    const w = weather.current;

    if (!w) {
        throw new Error("Open-Meteo не вернул текущие данные для этой точки.");
    }

    // AIR_QUALITY: качество воздуха — необязательная часть: если недоступно, просто не заполняем.
    // const a =
    //     airResult.status === "fulfilled" ? airResult.value.current : undefined;

    return {
        time: w.time ? `${w.time}Z` : null,

        temperature: num(w.temperature_2m),
        humidity: num(w.relative_humidity_2m),
        pressure: num(w.surface_pressure),
        windSpeed: num(w.wind_speed_10m),
        windDirectionDegrees: num(w.wind_direction_10m),
        precipitation: num(w.precipitation),

        // AIR_QUALITY
        // pm25: num(a?.pm2_5),
        // pm10: num(a?.pm10),
        // co: num(a?.carbon_monoxide),
        // no2: num(a?.nitrogen_dioxide),
        // so2: num(a?.sulphur_dioxide),
        //
        // airQualityAvailable: a !== undefined,
    };
}

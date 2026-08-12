import type { Measurement } from "../../types/Measurement";

export interface MeasurementFormValues {
    sensorName: string;
    comment: string;

    o2: string;
    co: string;
    sO2: string;
    no: string;
    ch: string;
    cO2: string;
    nO2: string;
    h2CO: string;

    pM25: string;
    pM10: string;
    tvoc: string;

    windSpeed: string;
    windDirection: string;

    measurementTime: string;

    humidity: string;
    atmosphericPressure: string;

    precipitation: string;
    precipitationPerHour: string;

    airTemperature: string;
}

export function getCurrentDateTimeLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
}

function toDateTimeLocal(value?: string | null) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
}

function toFieldString(value?: number | null) {
    return value === null || value === undefined ? "" : String(value);
}

export function createEmptyMeasurementForm(): MeasurementFormValues {
    return {
        sensorName: "",
        comment: "",

        o2: "",
        co: "",
        sO2: "",
        no: "",
        ch: "",
        cO2: "",
        nO2: "",
        h2CO: "",

        pM25: "",
        pM10: "",
        tvoc: "",

        windSpeed: "",
        windDirection: "",

        measurementTime: getCurrentDateTimeLocal(),

        humidity: "",
        atmosphericPressure: "",

        precipitation: "",
        precipitationPerHour: "",

        airTemperature: "",
    };
}

export function measurementToFormValues(
    measurement: Measurement
): MeasurementFormValues {
    return {
        sensorName: measurement.sensorName ?? "",
        comment: measurement.comment ?? "",

        o2: toFieldString(measurement.o2),
        co: toFieldString(measurement.co),
        sO2: toFieldString(measurement.sO2),
        no: toFieldString(measurement.no),
        ch: toFieldString(measurement.ch),
        cO2: toFieldString(measurement.cO2),
        nO2: toFieldString(measurement.nO2),
        h2CO: toFieldString(measurement.h2CO),

        pM25: toFieldString(measurement.pM25),
        pM10: toFieldString(measurement.pM10),
        tvoc: toFieldString(measurement.tvoc),

        windSpeed: toFieldString(measurement.windSpeed),
        windDirection: measurement.windDirection ?? "",

        measurementTime: toDateTimeLocal(
            measurement.measurementTime ?? measurement.creationDate
        ),

        humidity: toFieldString(measurement.humidity),
        atmosphericPressure: toFieldString(measurement.atmosphericPressure),

        precipitation: toFieldString(measurement.precipitation),
        precipitationPerHour: toFieldString(
            measurement.precipitationPerHour
        ),

        airTemperature: toFieldString(measurement.airTemperature),
    };
}

export function numberOrNull(value: string) {
    if (value.trim() === "") {
        return null;
    }

    const number = Number(value);

    return Number.isNaN(number) ? null : number;
}

// Формирует payload в формате, ожидаемом бэкендом (CreateMeasurementRequest).
export function buildMeasurementRequest(values: MeasurementFormValues) {
    return {
        sensorName: values.sensorName.trim(),
        comment: values.comment.trim() || null,

        o2: numberOrNull(values.o2),
        co: numberOrNull(values.co),
        so2: numberOrNull(values.sO2),
        no: numberOrNull(values.no),
        ch: numberOrNull(values.ch),
        co2: numberOrNull(values.cO2),
        no2: numberOrNull(values.nO2),
        h2co: numberOrNull(values.h2CO),

        pm25: numberOrNull(values.pM25),
        pm10: numberOrNull(values.pM10),
        tvoc: numberOrNull(values.tvoc),

        windSpeed: numberOrNull(values.windSpeed),
        windDirection: values.windDirection.trim() || null,

        measurementTime: values.measurementTime
            ? new Date(values.measurementTime).toISOString()
            : null,

        humidity: numberOrNull(values.humidity),
        atmosphericPressure: numberOrNull(values.atmosphericPressure),

        precipitation: numberOrNull(values.precipitation),
        precipitationPerHour: numberOrNull(values.precipitationPerHour),

        airTemperature: numberOrNull(values.airTemperature),
    };
}

// Список загрязнителей/показателей, используемый для фильтрации списков
// и для краткой сводки при клике на метку.
export const POLLUTANT_FIELDS: {
    key: keyof Measurement;
    label: string;
    unit?: string;
}[] = [
    { key: "cO2", label: "CO₂" },
    { key: "pM25", label: "PM2.5" },
    { key: "pM10", label: "PM10" },
    { key: "co", label: "CO" },
    { key: "sO2", label: "SO₂" },
    { key: "nO2", label: "NO₂" },
    { key: "no", label: "NO" },
    { key: "ch", label: "CH" },
    { key: "h2CO", label: "H₂CO" },
    { key: "tvoc", label: "TVOC" },
    { key: "o2", label: "O₂" },
];

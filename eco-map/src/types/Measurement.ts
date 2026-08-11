

export interface Measurement {
    id: number;
    locationId: number;

    sensorName: string;
    comment?: string | null;

    o2?: number | null;
    co?: number | null;
    sO2?: number | null;
    no?: number | null;
    ch?: number | null;
    cO2?: number | null;
    nO2?: number | null;
    h2CO?: number | null;

    pM25?: number | null;
    pM10?: number | null;
    tvoc?: number | null;

    windSpeed?: number | null;
    windDirection?: string | null;

    creationDate: string;
    measurementTime?: string | null;

    humidity?: number | null;
    atmosphericPressure?: number | null;

    precipitation?: number | null;
    precipitationPerHour?: number | null;

    airTemperature?: number | null;
}

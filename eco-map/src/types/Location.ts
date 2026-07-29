import type { Sensor } from "./Sensor";

export interface Location {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    sensors: Sensor[];
}
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";
import type { Location } from "../../types/Location";
import type { Measurement } from "../../types/Measurement";
import MeasurementList from "../measurements/MeasurementList";
import { POLLUTANT_FIELDS } from "../measurements/measurementForm.types";
import { formatDate } from "../../utils/format";
import "./ObjectsListPanel.css";

interface Props {
    locations: Location[];
    onSelectLocation?: (location: Location) => void;
}

function ObjectsListPanel({ locations, onSelectLocation }: Props) {
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [pollutant, setPollutant] = useState("all");
    const [locationSearch, setLocationSearch] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);

                const response = await api.get<Measurement[]>(
                    "/Measurement"
                );

                if (!cancelled) {
                    setMeasurements(response.data);
                    setError("");
                }
            } catch (err) {
                console.error(err);

                if (!cancelled) {
                    setError("Не удалось загрузить список замеров.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    const locationNameById = useMemo(() => {
        const map: Record<number, string> = {};

        locations.forEach((location) => {
            map[location.id] = location.name;
        });

        return map;
    }, [locations]);

    const filteredLocations = useMemo(() => {
        const query = locationSearch.trim().toLowerCase();

        if (!query) {
            return locations;
        }

        return locations.filter((location) =>
            location.name.toLowerCase().includes(query)
        );
    }, [locations, locationSearch]);

    const filteredMeasurements = useMemo(() => {
        const from = dateFrom ? new Date(dateFrom).getTime() : null;
        const to = dateTo ? new Date(dateTo).getTime() : null;

        return measurements.filter((measurement) => {
            const time = measurement.measurementTime ??
                measurement.creationDate;

            const timestamp = time ? new Date(time).getTime() : null;

            if (from !== null && (timestamp === null || timestamp < from)) {
                return false;
            }

            if (to !== null && (timestamp === null || timestamp > to)) {
                return false;
            }

            if (pollutant !== "all") {
                const value = (measurement as unknown as Record<
                    string,
                    number | null | undefined
                >)[pollutant];

                if (value === null || value === undefined) {
                    return false;
                }
            }

            return true;
        });
    }, [measurements, dateFrom, dateTo, pollutant]);

    function resetFilters() {
        setDateFrom("");
        setDateTo("");
        setPollutant("all");
        setLocationSearch("");
    }

    return (
        <div className="olp">
            <div className="olp-filters">
                <label className="olp-filter">
                    Поиск локации
                    <input
                        type="text"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder="Название точки"
                    />
                </label>

                <label className="olp-filter">
                    С
                    <input
                        type="datetime-local"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                </label>

                <label className="olp-filter">
                    По
                    <input
                        type="datetime-local"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </label>

                <label className="olp-filter">
                    Тип загрязнения
                    <select
                        value={pollutant}
                        onChange={(e) => setPollutant(e.target.value)}
                    >
                        <option value="all">Все показатели</option>
                        {POLLUTANT_FIELDS.map((field) => (
                            <option key={field.key} value={field.key}>
                                {field.label}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    type="button"
                    className="olp-reset"
                    onClick={resetFilters}
                >
                    Сбросить
                </button>
            </div>

            <div className="olp-section">
                <h4 className="olp-section-title">
                    Локации ({filteredLocations.length})
                </h4>

                {filteredLocations.length === 0 ? (
                    <p className="olp-empty">Локации не найдены.</p>
                ) : (
                    <ul className="olp-location-list">
                        {filteredLocations.map((location) => (
                            <li key={location.id}>
                                <button
                                    type="button"
                                    className="olp-location-item"
                                    onClick={() =>
                                        onSelectLocation?.(location)
                                    }
                                >
                                    <span className="olp-location-name">
                                        {location.name}
                                    </span>

                                    <span className="olp-location-meta">
                                        {location.latitude.toFixed(4)},{" "}
                                        {location.longitude.toFixed(4)}
                                        {location.creationDate
                                            ? ` · добавлена ${formatDate(
                                                  location.creationDate
                                              )}`
                                            : ""}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="olp-section">
                <h4 className="olp-section-title">
                    Замеры ({filteredMeasurements.length}
                    {measurements.length !== filteredMeasurements.length
                        ? ` из ${measurements.length}`
                        : ""}
                    )
                </h4>

                {error && <p className="olp-error">{error}</p>}

                {loading ? (
                    <p className="olp-empty">Загрузка...</p>
                ) : (
                    <MeasurementList
                        measurements={filteredMeasurements}
                        locationNameById={locationNameById}
                        emptyText="Замеры по выбранным фильтрам не найдены."
                    />
                )}
            </div>
        </div>
    );
}

export default ObjectsListPanel;

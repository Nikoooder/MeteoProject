
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../api/AuthContext";
import type { Location } from "../types/Location";
import type { Measurement } from "../types/Measurement";
import "./Profile.css";

interface LocationWithMeasurements extends Location {
    measurements: Measurement[];
}

interface MeasurementForm {
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

function formatDate(value?: string | null) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function average(values: (number | null | undefined)[]) {
    const numbers = values.filter(
        (value): value is number =>
            typeof value === "number" && !Number.isNaN(value)
    );

    if (numbers.length === 0) {
        return null;
    }

    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function formatNumber(value: number | null, digits = 1) {
    if (value === null) {
        return "—";
    }

    return value.toFixed(digits);
}

function getCurrentDateTimeLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
}

function createEmptyMeasurementForm(): MeasurementForm {
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

function numberOrNull(value: string) {
    if (value.trim() === "") {
        return null;
    }

    const number = Number(value);

    return Number.isNaN(number) ? null : number;
}

function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [locations, setLocations] = useState<LocationWithMeasurements[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openLocationId, setOpenLocationId] = useState<number | null>(null);

    const [exportingId, setExportingId] = useState<number | null>(null);

    const [measurementLocationId, setMeasurementLocationId] =
        useState<number | null>(null);

    const [measurementForm, setMeasurementForm] =
        useState<MeasurementForm>(createEmptyMeasurementForm());

    const [creatingMeasurement, setCreatingMeasurement] = useState(false);
    const [measurementError, setMeasurementError] = useState("");

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        let cancelled = false;

        async function load() {
            try {
                setLoading(true);

                const locationsResponse = await api.get<Location[]>("/Location");

                const myLocations = locationsResponse.data.filter(
                    (location) => location.userId === user.id
                );

                const locationsWithMeasurements = await Promise.all(
                    myLocations.map(async (location) => {
                        const measurementsResponse =
                            await api.get<Measurement[]>(
                                `/Measurement/location/${location.id}`
                            );

                        return {
                            ...location,
                            measurements: measurementsResponse.data,
                        };
                    })
                );

                locationsWithMeasurements.sort((a, b) => {
                    const dateA = a.creationDate
                        ? new Date(a.creationDate).getTime()
                        : 0;

                    const dateB = b.creationDate
                        ? new Date(b.creationDate).getTime()
                        : 0;

                    return dateB - dateA;
                });

                if (!cancelled) {
                    setLocations(locationsWithMeasurements);
                    setError("");
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);

                if (!cancelled) {
                    setError(
                        "Не удалось загрузить данные личного кабинета."
                    );
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [user, navigate]);

    const allMeasurements = useMemo(() => {
        return locations.flatMap((location) => location.measurements);
    }, [locations]);

    const stats = useMemo(() => {
        const sensors = new Set(
            allMeasurements
                .map((measurement) => measurement.sensorName)
                .filter((sensor): sensor is string => Boolean(sensor))
        );

        const latest = allMeasurements.reduce<string | null>(
            (latestDate, measurement) => {
                const time =
                    measurement.measurementTime ??
                    measurement.creationDate;

                if (!time) {
                    return latestDate;
                }

                if (
                    !latestDate ||
                    new Date(time).getTime() >
                        new Date(latestDate).getTime()
                ) {
                    return time;
                }

                return latestDate;
            },
            null
        );

        return {
            totalLocations: locations.length,
            totalMeasurements: allMeasurements.length,
            sensorsCount: sensors.size,
            latestMeasurement: latest,

            avgTemperature: average(
                allMeasurements.map(
                    (measurement) => measurement.airTemperature
                )
            ),

            avgHumidity: average(
                allMeasurements.map((measurement) => measurement.humidity)
            ),

            avgCO2: average(
                allMeasurements.map((measurement) => measurement.cO2)
            ),

            avgPM25: average(
                allMeasurements.map((measurement) => measurement.pM25)
            ),
        };
    }, [locations, allMeasurements]);

    function openMeasurementForm(locationId: number) {
        setMeasurementLocationId(locationId);
        setMeasurementForm(createEmptyMeasurementForm());
        setMeasurementError("");
    }

    function closeMeasurementForm() {
        setMeasurementLocationId(null);
        setMeasurementForm(createEmptyMeasurementForm());
        setMeasurementError("");
    }

    function updateMeasurementField(
        field: keyof MeasurementForm,
        value: string
    ) {
        setMeasurementForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    async function handleCreateMeasurement(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (measurementLocationId === null) {
            return;
        }

        if (!measurementForm.sensorName.trim()) {
            setMeasurementError("Укажите название датчика.");
            return;
        }

        try {
            setCreatingMeasurement(true);
            setMeasurementError("");

            const request = {
                sensorName: measurementForm.sensorName.trim(),
                comment: measurementForm.comment.trim() || null,

                o2: numberOrNull(measurementForm.o2),
                co: numberOrNull(measurementForm.co),
                so2: numberOrNull(measurementForm.sO2),
                no: numberOrNull(measurementForm.no),
                ch: numberOrNull(measurementForm.ch),
                co2: numberOrNull(measurementForm.cO2),
                no2: numberOrNull(measurementForm.nO2),
                h2co: numberOrNull(measurementForm.h2CO),

                pm25: numberOrNull(measurementForm.pM25),
                pm10: numberOrNull(measurementForm.pM10),
                tvoc: numberOrNull(measurementForm.tvoc),

                windSpeed: numberOrNull(measurementForm.windSpeed),

                windDirection:
                    measurementForm.windDirection.trim() || null,

                measurementTime: measurementForm.measurementTime
                    ? new Date(
                          measurementForm.measurementTime
                      ).toISOString()
                    : null,

                humidity: numberOrNull(measurementForm.humidity),

                atmosphericPressure: numberOrNull(
                    measurementForm.atmosphericPressure
                ),

                precipitation: numberOrNull(
                    measurementForm.precipitation
                ),

                precipitationPerHour: numberOrNull(
                    measurementForm.precipitationPerHour
                ),

                airTemperature: numberOrNull(
                    measurementForm.airTemperature
                ),
            };

            const response = await api.post<Measurement>(
                `/Measurement/${measurementLocationId}/measurements`,
request
            );

const newMeasurement = response.data;

setLocations((previousLocations) =>
    previousLocations.map((location) => {
        if (location.id !== measurementLocationId) {
            return location;
        }

        return {
            ...location,
            measurements: [
                ...location.measurements,
                newMeasurement,
            ],
        };
    })
);

closeMeasurementForm();
        } catch (err) {
    console.error(err);

    setMeasurementError("Не удалось создать замер.");
} finally {
    setCreatingMeasurement(false);
}
    }

async function handleExport(location: LocationWithMeasurements) {
    try {
        setExportingId(location.id);

        const response = await api.get(
            `/Location/${location.id}/export`,
            {
                responseType: "blob",
            }
        );

        const url = window.URL.createObjectURL(
            new Blob([response.data])
        );

        const link = document.createElement("a");

        link.href = url;
        link.download = `${location.name}.xlsx`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error(err);
        alert("Не удалось экспортировать данные локации.");
    } finally {
        setExportingId(null);
    }
}

function handleLogout() {
    logout();
    navigate("/login");
}

if (!user) {
    return null;
}

return (
    <div className="profile">
        <header className="profile-header">
            <Link to="/home" className="profile-back">
                ← Карта
            </Link>

            <h1 className="profile-title">
                Личный кабинет
            </h1>

            <button
                className="profile-logout"
                onClick={handleLogout}
            >
                Выйти
            </button>
        </header>

        <main className="profile-content">
            <section className="profile-card">
                <div className="profile-avatar">
                    {user.username.charAt(0).toUpperCase()}
                </div>

                <div className="profile-info">
                    <h2 className="profile-username">
                        {user.username}
                    </h2>

                    <p className="profile-email">
                        {user.email}
                    </p>

                    <p className="profile-id">
                        ID пользователя: {user.id}
                    </p>
                </div>
            </section>

            {error && (
                <p className="profile-error">
                    {error}
                </p>
            )}

            <section className="profile-stats">
                <div className="stat-card">
                    <span className="stat-value">
                        {stats.totalLocations}
                    </span>

                    <span className="stat-label">
                        Локаций
                    </span>
                </div>

                <div className="stat-card">
                    <span className="stat-value">
                        {stats.totalMeasurements}
                    </span>

                    <span className="stat-label">
                        Замеров
                    </span>
                </div>

                <div className="stat-card">
                    <span className="stat-value">
                        {stats.sensorsCount}
                    </span>

                    <span className="stat-label">
                        Датчиков
                    </span>
                </div>

                <div className="stat-card">
                    <span className="stat-value stat-value-small">
                        {formatDate(stats.latestMeasurement)}
                    </span>

                    <span className="stat-label">
                        Последний замер
                    </span>
                </div>

                <div className="stat-card">
                    <span className="stat-value">
                        {formatNumber(stats.avgTemperature)}°C
                    </span>

                    <span className="stat-label">
                        Средняя температура
                    </span>
                </div>

                <div className="stat-card">
                    <span className="stat-value">
                        {formatNumber(stats.avgHumidity)}%
                    </span>

                    <span className="stat-label">
                        Средняя влажность
                    </span>
                </div>

                <div className="stat-card">
                    <span className="stat-value">
                        {formatNumber(stats.avgCO2)}
                    </span>

                    <span className="stat-label">
                        Средний CO₂
                    </span>
                </div>

                <div className="stat-card">
                    <span className="stat-value">
                        {formatNumber(stats.avgPM25)}
                    </span>

                    <span className="stat-label">
                        Средний PM2.5
                    </span>
                </div>
            </section>

            <section className="profile-locations">
                <h2 className="section-title">
                    Мои локации и замеры
                </h2>

                {loading && (
                    <p className="profile-status">
                        Загрузка...
                    </p>
                )}

                {!loading &&
                    locations.length === 0 &&
                    !error && (
                        <div className="empty-state">
                            <p>
                                Вы ещё не добавили ни одной
                                локации.
                            </p>

                            <Link
                                to="/home"
                                className="empty-state-link"
                            >
                                Перейти к карте
                            </Link>
                        </div>
                    )}

                {locations.map((location) => {
                    const isOpen =
                        openLocationId === location.id;

                    const isMeasurementFormOpen =
                        measurementLocationId === location.id;

                    return (
                        <div
                            className="location-card"
                            key={location.id}
                        >
                            <button
                                className="location-card-header"
                                onClick={() =>
                                    setOpenLocationId(
                                        isOpen
                                            ? null
                                            : location.id
                                    )
                                }
                            >
                                <div className="location-card-main">
                                    <span className="location-name">
                                        {location.name}
                                    </span>

                                    <span className="location-meta">
                                        {location.latitude.toFixed(4)}
                                        ,{" "}
                                        {location.longitude.toFixed(4)}
                                        {" · "}
                                        добавлена{" "}
                                        {formatDate(
                                            location.creationDate
                                        )}
                                    </span>
                                </div>

                                <div className="location-card-side">
                                    <span className="location-count">
                                        {
                                            location.measurements
                                                .length
                                        }{" "}
                                        замер(ов)
                                    </span>

                                    <span className="location-toggle">
                                        {isOpen ? "⌃" : "⌄"}
                                    </span>
                                </div>
                            </button>

                            {isOpen && (
                                <div className="location-card-body">
                                    <div className="location-card-actions">
                                        <button
                                            type="button"
                                            className="add-measurement-button"
                                            onClick={() =>
                                                isMeasurementFormOpen
                                                    ? closeMeasurementForm()
                                                    : openMeasurementForm(
                                                        location.id
                                                    )
                                            }
                                        >
                                            {isMeasurementFormOpen
                                                ? "Отменить"
                                                : "Добавить замер"}
                                        </button>

                                        <button
                                            type="button"
                                            className="export-button"
                                            onClick={() =>
                                                handleExport(location)
                                            }
                                            disabled={
                                                exportingId ===
                                                location.id
                                            }
                                        >
                                            {exportingId ===
                                                location.id
                                                ? "Экспорт..."
                                                : "Скачать .xlsx"}
                                        </button>
                                    </div>

                                    {isMeasurementFormOpen && (
                                        <form
                                            className="measurement-form"
                                            onSubmit={
                                                handleCreateMeasurement
                                            }
                                        >
                                            <div className="measurement-form-header">
                                                <div>
                                                    <h3 className="measurement-form-title">
                                                        Новый замер
                                                    </h3>

                                                    <p className="measurement-form-description">
                                                        Укажите параметры
                                                        измерения для этой
                                                        локации.
                                                    </p>
                                                </div>
                                            </div>

                                            {measurementError && (
                                                <p className="profile-error">
                                                    {measurementError}
                                                </p>
                                            )}

                                            <div className="measurement-form-section">
                                                <h4 className="measurement-form-section-title">
                                                    Основные параметры
                                                </h4>

                                                <div className="measurement-form-grid">
                                                    <label className="measurement-form-label">
                                                        Датчик
                                                        <span className="measurement-required">
                                                            *
                                                        </span>

                                                        <input
                                                            className="measurement-form-input"
                                                            type="text"
                                                            value={
                                                                measurementForm.sensorName
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "sensorName",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            required
                                                            placeholder="Например, AirSensor-01"
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        Время замера

                                                        <input
                                                            className="measurement-form-input"
                                                            type="datetime-local"
                                                            value={
                                                                measurementForm.measurementTime
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "measurementTime",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        Температура, °C

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.airTemperature
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "airTemperature",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        Влажность, %

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.humidity
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "humidity",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        CO₂

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.cO2
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "cO2",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        PM2.5

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.pM25
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "pM25",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        PM10

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.pM10
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "pM10",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        Скорость ветра

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.windSpeed
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "windSpeed",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        Направление ветра

                                                        <input
                                                            className="measurement-form-input"
                                                            type="text"
                                                            value={
                                                                measurementForm.windDirection
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "windDirection",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Например, СЗ"
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="measurement-form-section">
                                                <h4 className="measurement-form-section-title">
                                                    Загрязнители и
                                                    дополнительные
                                                    параметры
                                                </h4>

                                                <div className="measurement-form-grid">
                                                    <label className="measurement-form-label">
                                                        O₂

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.o2
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "o2",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        CO

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.co
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "co",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        SO₂

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.sO2
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "sO2",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        NO

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.no
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "no",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        CH

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.ch
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "ch",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        NO₂

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.nO2
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "nO2",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        H₂CO

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.h2CO
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "h2CO",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        TVOC

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.tvoc
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "tvoc",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        Атмосферное давление

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.atmosphericPressure
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "atmosphericPressure",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        Осадки

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.precipitation
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "precipitation",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="measurement-form-label">
                                                        Осадки в час

                                                        <input
                                                            className="measurement-form-input"
                                                            type="number"
                                                            step="any"
                                                            value={
                                                                measurementForm.precipitationPerHour
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateMeasurementField(
                                                                    "precipitationPerHour",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="measurement-form-section">
                                                <label className="measurement-form-label">
                                                    Комментарий

                                                    <textarea
                                                        className="measurement-form-textarea"
                                                        value={
                                                            measurementForm.comment
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateMeasurementField(
                                                                "comment",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        rows={3}
                                                        placeholder="Дополнительная информация о замере"
                                                    />
                                                </label>
                                            </div>

                                            <div className="measurement-form-actions">
                                                <button
                                                    type="button"
                                                    className="measurement-cancel-button"
                                                    onClick={
                                                        closeMeasurementForm
                                                    }
                                                    disabled={
                                                        creatingMeasurement
                                                    }
                                                >
                                                    Отмена
                                                </button>

                                                <button
                                                    type="submit"
                                                    className="measurement-submit-button"
                                                    disabled={
                                                        creatingMeasurement
                                                    }
                                                >
                                                    {creatingMeasurement
                                                        ? "Сохранение..."
                                                        : "Создать замер"}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {location.measurements.length === 0 ? (
                                        <p className="profile-status">
                                            Для этой локации пока нет
                                            замеров.
                                        </p>
                                    ) : (
                                        <div className="measurements-table-wrapper">
                                            <table className="measurements-table">
                                                <thead>
                                                    <tr>
                                                        <th>Время</th>
                                                        <th>Датчик</th>
                                                        <th>T, °C</th>
                                                        <th>
                                                            Влажность, %
                                                        </th>
                                                        <th>CO₂</th>
                                                        <th>PM2.5</th>
                                                        <th>PM10</th>
                                                        <th>Ветер</th>
                                                        <th>
                                                            Комментарий
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {location.measurements.map(
                                                        (measurement) => (
                                                            <tr
                                                                key={
                                                                    measurement.id
                                                                }
                                                            >
                                                                <td>
                                                                    {formatDate(
                                                                        measurement.measurementTime ??
                                                                        measurement.creationDate
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    {measurement.sensorName ||
                                                                        "—"}
                                                                </td>

                                                                <td>
                                                                    {measurement.airTemperature ??
                                                                        "—"}
                                                                </td>

                                                                <td>
                                                                    {measurement.humidity ??
                                                                        "—"}
                                                                </td>

                                                                <td>
                                                                    {measurement.cO2 ??
                                                                        "—"}
                                                                </td>

                                                                <td>
                                                                    {measurement.pM25 ??
                                                                        "—"}
                                                                </td>

                                                                <td>
                                                                    {measurement.pM10 ??
                                                                        "—"}
                                                                </td>

                                                                <td>
                                                                    {measurement.windSpeed ??
                                                                        "—"}

                                                                    {measurement.windDirection
                                                                        ? ` ${measurement.windDirection}`
                                                                        : ""}
                                                                </td>

                                                                <td>
                                                                    {measurement.comment ||
                                                                        "—"}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </section>
        </main>
    </div>
);
}

export default Profile;

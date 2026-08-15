import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../api/AuthContext";
import type { Location } from "../types/Location";
import type { Measurement } from "../types/Measurement";
import LocationForm from "../components/locations/LocationForm";
import MeasurementForm from "../components/measurements/MeasurementForm";
import MeasurementList from "../components/measurements/MeasurementList";
import {
    buildMeasurementRequest,
    measurementToFormValues,
} from "../components/measurements/measurementForm.types";
import type { MeasurementFormValues } from "../components/measurements/measurementForm.types";
import { average, formatDate, formatNumber } from "../utils/format";
import EcoMonitorButton from "../components/common/EcoMonitorButton";
import ThemeToggle from "../components/common/ThemeToggle";
import "./Profile.css";

interface LocationWithMeasurements extends Location {
    measurements: Measurement[];
}

function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [locations, setLocations] = useState<LocationWithMeasurements[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openLocationId, setOpenLocationId] = useState<number | null>(null);

    const [exportingId, setExportingId] = useState<number | null>(null);

    // Импорт из Excel
    const importInputRef = useRef<HTMLInputElement | null>(null);
    const [importing, setImporting] = useState(false);
    const [importMessage, setImportMessage] = useState("");
    const [importError, setImportError] = useState(false);

    // Редактирование локации
    const [editingLocationId, setEditingLocationId] = useState<number | null>(
        null
    );
    const [editingLocationCoords, setEditingLocationCoords] = useState({
        latitude: 0,
        longitude: 0,
    });
    const [savingLocation, setSavingLocation] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [deletingLocationId, setDeletingLocationId] = useState<
        number | null
    >(null);

    // Создание / редактирование замера
    const [measurementLocationId, setMeasurementLocationId] = useState<
        number | null
    >(null);
    const [editingMeasurement, setEditingMeasurement] =
        useState<Measurement | null>(null);
    const [creatingMeasurement, setCreatingMeasurement] = useState(false);
    const [measurementError, setMeasurementError] = useState("");
    const [deletingMeasurementId, setDeletingMeasurementId] = useState<
        number | null
    >(null);

    async function loadProfileData(userId: number, signal?: { cancelled: boolean }) {
        try {
            setLoading(true);

            const locationsResponse = await api.get<Location[]>("/Location");

            const myLocations = locationsResponse.data.filter(
                (location) => location.userId === userId
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

            if (!signal?.cancelled) {
                setLocations(locationsWithMeasurements);
                setError("");
                setLoading(false);
            }
        } catch (err) {
            console.error(err);

            if (!signal?.cancelled) {
                setError("Не удалось загрузить данные личного кабинета.");
                setLoading(false);
            }
        }
    }

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const signal = { cancelled: false };

        void loadProfileData(user.id, signal);

        return () => {
            signal.cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    measurement.measurementTime ?? measurement.creationDate;

                if (!time) {
                    return latestDate;
                }

                if (
                    !latestDate ||
                    new Date(time).getTime() > new Date(latestDate).getTime()
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
                allMeasurements.map((measurement) => measurement.airTemperature)
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

    // ------------------------- Локации: редактирование/удаление -------------------------

    function openEditLocation(location: LocationWithMeasurements) {
        setEditingLocationId(location.id);
        setEditingLocationCoords({
            latitude: location.latitude,
            longitude: location.longitude,
        });
        setLocationError("");
    }

    function closeEditLocation() {
        setEditingLocationId(null);
        setLocationError("");
    }

    async function handleUpdateLocation(
        location: LocationWithMeasurements,
        name: string
    ) {
        try {
            setSavingLocation(true);
            setLocationError("");

            await api.put(`/Location/${location.id}`, {
                name,
                latitude: editingLocationCoords.latitude,
                longitude: editingLocationCoords.longitude,
            });

            setLocations((previous) =>
                previous.map((l) =>
                    l.id === location.id
                        ? {
                              ...l,
                              name,
                              latitude: editingLocationCoords.latitude,
                              longitude: editingLocationCoords.longitude,
                          }
                        : l
                )
            );

            closeEditLocation();
        } catch (err) {
            console.error(err);
            setLocationError("Не удалось обновить локацию.");
        } finally {
            setSavingLocation(false);
        }
    }

    async function handleDeleteLocation(location: LocationWithMeasurements) {
        if (
            !window.confirm(
                `Удалить локацию «${location.name}» вместе со всеми замерами?`
            )
        ) {
            return;
        }

        try {
            setDeletingLocationId(location.id);

            await api.delete(`/Location/${location.id}`);

            setLocations((previous) =>
                previous.filter((l) => l.id !== location.id)
            );
        } catch (err) {
            console.error(err);
            alert("Не удалось удалить локацию.");
        } finally {
            setDeletingLocationId(null);
        }
    }

    // ------------------------- Замеры: создание/редактирование/удаление -------------------------

    function openMeasurementForm(locationId: number) {
        setMeasurementLocationId(locationId);
        setEditingMeasurement(null);
        setMeasurementError("");
    }

    function openEditMeasurementForm(
        locationId: number,
        measurement: Measurement
    ) {
        setMeasurementLocationId(locationId);
        setEditingMeasurement(measurement);
        setMeasurementError("");
    }

    function closeMeasurementForm() {
        setMeasurementLocationId(null);
        setEditingMeasurement(null);
        setMeasurementError("");
    }

    async function handleCreateMeasurement(values: MeasurementFormValues) {
        if (measurementLocationId === null) {
            return;
        }

        try {
            setCreatingMeasurement(true);
            setMeasurementError("");

            const response = await api.post<Measurement>(
                `/Measurement/${measurementLocationId}/measurements`,
                buildMeasurementRequest(values)
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

    async function handleUpdateMeasurement(values: MeasurementFormValues) {
        if (measurementLocationId === null || !editingMeasurement) {
            return;
        }

        try {
            setCreatingMeasurement(true);
            setMeasurementError("");

            const response = await api.put<Measurement>(
                `/Measurement/${editingMeasurement.id}`,
                buildMeasurementRequest(values)
            );

            setLocations((previousLocations) =>
                previousLocations.map((location) => {
                    if (location.id !== measurementLocationId) {
                        return location;
                    }

                    return {
                        ...location,
                        measurements: location.measurements.map((m) =>
                            m.id === editingMeasurement.id ? response.data : m
                        ),
                    };
                })
            );

            closeMeasurementForm();
        } catch (err) {
            console.error(err);
            setMeasurementError("Не удалось обновить замер.");
        } finally {
            setCreatingMeasurement(false);
        }
    }

    async function handleDeleteMeasurement(
        locationId: number,
        measurement: Measurement
    ) {
        if (!window.confirm("Удалить этот замер?")) {
            return;
        }

        try {
            setDeletingMeasurementId(measurement.id);

            await api.delete(`/Measurement/${measurement.id}`);

            setLocations((previousLocations) =>
                previousLocations.map((location) => {
                    if (location.id !== locationId) {
                        return location;
                    }

                    return {
                        ...location,
                        measurements: location.measurements.filter(
                            (m) => m.id !== measurement.id
                        ),
                    };
                })
            );
        } catch (err) {
            console.error(err);
            alert("Не удалось удалить замер.");
        } finally {
            setDeletingMeasurementId(null);
        }
    }

    async function handleExport(location: LocationWithMeasurements) {
        try {
            setExportingId(location.id);

            const response = await api.get(`/Location/${location.id}/export`, {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));

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

    function handleImportClick() {
        setImportMessage("");
        setImportError(false);
        importInputRef.current?.click();
    }

    async function handleImportFileSelected(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        // Сбрасываем value, чтобы можно было повторно
        // выбрать тот же файл.
        event.target.value = "";

        if (!file || !user) {
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setImporting(true);
            setImportError(false);
            setImportMessage("");

            const response = await api.post("/Location/import", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const { locationName, measurementsCount } = response.data ?? {};

            setImportMessage(
                locationName
                    ? `Импортировано: «${locationName}», замеров — ${measurementsCount ?? 0}.`
                    : "Импорт завершён успешно."
            );

            await loadProfileData(user.id);
        } catch (err) {
            console.error(err);
            setImportError(true);
            setImportMessage(
                "Не удалось импортировать файл. Проверьте, что это .xlsx, экспортированный из EcoMonitor."
            );
        } finally {
            setImporting(false);
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
                <div className="profile-header-left">
                    <EcoMonitorButton />

                    <Link to="/home" className="profile-back">
                        ← Карта
                    </Link>
                </div>

                <h1 className="profile-title">Личный кабинет</h1>

                <div className="profile-header-right">
                    <ThemeToggle />

                    <input
                        ref={importInputRef}
                        type="file"
                        accept=".xlsx"
                        style={{ display: "none" }}
                        onChange={handleImportFileSelected}
                    />

                    <button
                        type="button"
                        className="profile-import"
                        onClick={handleImportClick}
                        disabled={importing}
                    >
                        {importing ? "Импорт..." : "Импорт из Excel"}
                    </button>

                    <button className="profile-logout" onClick={handleLogout}>
                        Выйти
                    </button>
                </div>
            </header>

            {importMessage && (
                <p
                    className={
                        importError
                            ? "profile-import-message profile-import-message-error"
                            : "profile-import-message"
                    }
                    style={{ margin: "12px 24px 0" }}
                >
                    {importMessage}
                </p>
            )}

            <main className="profile-content">
                <section className="profile-card">
                    <div className="profile-avatar">
                        {user.username.charAt(0).toUpperCase()}
                    </div>

                    <div className="profile-info">
                        <h2 className="profile-username">{user.username}</h2>
                        <p className="profile-email">{user.email}</p>
                        <p className="profile-id">ID пользователя: {user.id}</p>
                    </div>
                </section>

                {error && <p className="profile-error">{error}</p>}

                <section className="profile-stats">
                    <div className="stat-card">
                        <span className="stat-value">
                            {stats.totalLocations}
                        </span>
                        <span className="stat-label">Локаций</span>
                    </div>

                    <div className="stat-card">
                        <span className="stat-value">
                            {stats.totalMeasurements}
                        </span>
                        <span className="stat-label">Замеров</span>
                    </div>

                    <div className="stat-card">
                        <span className="stat-value">
                            {stats.sensorsCount}
                        </span>
                        <span className="stat-label">Датчиков</span>
                    </div>

                    <div className="stat-card">
                        <span className="stat-value stat-value-small">
                            {formatDate(stats.latestMeasurement)}
                        </span>
                        <span className="stat-label">Последний замер</span>
                    </div>

                    <div className="stat-card">
                        <span className="stat-value">
                            {formatNumber(stats.avgTemperature)}°C
                        </span>
                        <span className="stat-label">Средняя температура</span>
                    </div>

                    <div className="stat-card">
                        <span className="stat-value">
                            {formatNumber(stats.avgHumidity)}%
                        </span>
                        <span className="stat-label">Средняя влажность</span>
                    </div>

                    <div className="stat-card">
                        <span className="stat-value">
                            {formatNumber(stats.avgCO2)}
                        </span>
                        <span className="stat-label">Средний CO₂</span>
                    </div>

                    <div className="stat-card">
                        <span className="stat-value">
                            {formatNumber(stats.avgPM25)}
                        </span>
                        <span className="stat-label">Средний PM2.5</span>
                    </div>
                </section>

                <section className="profile-locations">
                    <h2 className="section-title">Мои локации и замеры</h2>

                    {loading && <p className="profile-status">Загрузка...</p>}

                    {!loading && locations.length === 0 && !error && (
                        <div className="empty-state">
                            <p>Вы ещё не добавили ни одной локации.</p>

                            <Link to="/home" className="empty-state-link">
                                Перейти к карте
                            </Link>
                        </div>
                    )}

                    {locations.map((location) => {
                        const isOpen = openLocationId === location.id;

                        const isMeasurementFormOpen =
                            measurementLocationId === location.id &&
                            !editingMeasurement;

                        const isEditingThisLocation =
                            editingLocationId === location.id;

                        return (
                            <div className="location-card" key={location.id}>
                                <button
                                    className="location-card-header"
                                    onClick={() =>
                                        setOpenLocationId(
                                            isOpen ? null : location.id
                                        )
                                    }
                                >
                                    <div className="location-card-main">
                                        <span className="location-name">
                                            {location.name}
                                        </span>

                                        <span className="location-meta">
                                            {location.latitude.toFixed(4)},{" "}
                                            {location.longitude.toFixed(4)}
                                            {" · "}
                                            добавлена{" "}
                                            {formatDate(location.creationDate)}
                                        </span>
                                    </div>

                                    <div className="location-card-side">
                                        <span className="location-count">
                                            {location.measurements.length}{" "}
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
                                                className="add-measurement-button"
                                                onClick={() =>
                                                    isEditingThisLocation
                                                        ? closeEditLocation()
                                                        : openEditLocation(
                                                              location
                                                          )
                                                }
                                            >
                                                {isEditingThisLocation
                                                    ? "Отменить"
                                                    : "Редактировать локацию"}
                                            </button>

                                            <button
                                                type="button"
                                                className="export-button"
                                                onClick={() =>
                                                    handleExport(location)
                                                }
                                                disabled={
                                                    exportingId === location.id
                                                }
                                            >
                                                {exportingId === location.id
                                                    ? "Экспорт..."
                                                    : "Скачать .xlsx"}
                                            </button>

                                            <button
                                                type="button"
                                                className="export-button danger-button"
                                                onClick={() =>
                                                    handleDeleteLocation(
                                                        location
                                                    )
                                                }
                                                disabled={
                                                    deletingLocationId ===
                                                    location.id
                                                }
                                            >
                                                {deletingLocationId ===
                                                location.id
                                                    ? "Удаление..."
                                                    : "Удалить локацию"}
                                            </button>
                                        </div>

                                        {locationError &&
                                            isEditingThisLocation && (
                                                <p className="profile-error">
                                                    {locationError}
                                                </p>
                                            )}

                                        {isEditingThisLocation && (
                                            <LocationForm
                                                latitude={
                                                    editingLocationCoords.latitude
                                                }
                                                longitude={
                                                    editingLocationCoords.longitude
                                                }
                                                onChange={(lat, lon) =>
                                                    setEditingLocationCoords({
                                                        latitude: lat,
                                                        longitude: lon,
                                                    })
                                                }
                                                initialName={location.name}
                                                submitLabel={
                                                    savingLocation
                                                        ? "Сохранение..."
                                                        : "Сохранить"
                                                }
                                                onSubmit={(name) =>
                                                    handleUpdateLocation(
                                                        location,
                                                        name
                                                    )
                                                }
                                                onCancel={closeEditLocation}
                                            />
                                        )}

                                        {measurementLocationId ===
                                            location.id &&
                                            !editingMeasurement && (
                                                <MeasurementForm
                                                    submitting={
                                                        creatingMeasurement
                                                    }
                                                    error={measurementError}
                                                    onSubmit={
                                                        handleCreateMeasurement
                                                    }
                                                    onCancel={
                                                        closeMeasurementForm
                                                    }
                                                />
                                            )}

                                        {measurementLocationId ===
                                            location.id &&
                                            editingMeasurement && (
                                                <MeasurementForm
                                                    key={editingMeasurement.id}
                                                    title="Изменить замер"
                                                    submitLabel="Сохранить изменения"
                                                    submitting={
                                                        creatingMeasurement
                                                    }
                                                    error={measurementError}
                                                    initialValues={measurementToFormValues(
                                                        editingMeasurement
                                                    )}
                                                    onSubmit={
                                                        handleUpdateMeasurement
                                                    }
                                                    onCancel={
                                                        closeMeasurementForm
                                                    }
                                                />
                                            )}

                                        <MeasurementList
                                            measurements={
                                                location.measurements
                                            }
                                            onEdit={(measurement) =>
                                                openEditMeasurementForm(
                                                    location.id,
                                                    measurement
                                                )
                                            }
                                            onDelete={(measurement) =>
                                                handleDeleteMeasurement(
                                                    location.id,
                                                    measurement
                                                )
                                            }
                                            deletingId={deletingMeasurementId}
                                            emptyText="Для этой локации пока нет замеров."
                                        />
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

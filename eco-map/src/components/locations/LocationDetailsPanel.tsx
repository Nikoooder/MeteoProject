import { useEffect, useState } from "react";
import type { Location } from "../../types/Location";
import type { Measurement } from "../../types/Measurement";
import {
    createMeasurement,
    deleteLocation,
    deleteMeasurement,
    loadMeasurements,
    startSync,
    updateLocation,
    updateMeasurement,
} from "../../api/offlineData";
import LocationForm from "./LocationForm";
import MeasurementForm from "../measurements/MeasurementForm";
import MeasurementList from "../measurements/MeasurementList";
import {
    buildMeasurementRequest,
    measurementToFormValues,
} from "../measurements/measurementForm.types";
import type { MeasurementFormValues } from "../measurements/measurementForm.types";
import "./LocationDetailsPanel.css";

interface Props {
    location: Location;
    currentUserId?: number;
    onLocationUpdated: (location: Location) => void;
    onLocationDeleted: (id: number) => void;
    onClose: () => void;
}

function LocationDetailsPanel({
    location,
    currentUserId,
    onLocationUpdated,
    onLocationDeleted,
    onClose,
}: Props) {
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingLocation, setEditingLocation] = useState(false);
    const [locationCoords, setLocationCoords] = useState({
        latitude: location.latitude,
        longitude: location.longitude,
    });
    const [savingLocation, setSavingLocation] = useState(false);
    const [deletingLocation, setDeletingLocation] = useState(false);
    const [locationError, setLocationError] = useState("");

    const [measurementMode, setMeasurementMode] = useState<
        "closed" | "create" | "edit"
    >("closed");
    const [editingMeasurement, setEditingMeasurement] =
        useState<Measurement | null>(null);
    const [savingMeasurement, setSavingMeasurement] = useState(false);
    const [deletingMeasurementId, setDeletingMeasurementId] = useState<
        number | null
    >(null);
    const [measurementError, setMeasurementError] = useState("");

    const isOwner =
        currentUserId !== undefined && currentUserId === location.userId;

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);

                const data = await loadMeasurements(location);

                if (!cancelled) {
                    setMeasurements(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();

        setEditingLocation(false);
        setMeasurementMode("closed");
        setEditingMeasurement(null);
        setLocationCoords({
            latitude: location.latitude,
            longitude: location.longitude,
        });

        // Когда соединение появляется снова, очередь офлайн-изменений
        // отправляется на сервер — подхватываем результат и обновляем список.
        const stopSync = startSync(() => void load());

        return () => {
            cancelled = true;
            stopSync();
        };
    }, [location.id, location.latitude, location.longitude]);

    async function handleUpdateLocation(name: string) {
        try {
            setSavingLocation(true);
            setLocationError("");

            const updated = await updateLocation(
                location,
                name,
                locationCoords.latitude,
                locationCoords.longitude
            );

            onLocationUpdated(updated);

            setEditingLocation(false);
        } catch (err) {
            console.error(err);
            setLocationError("Не удалось обновить локацию. Изменения сохранены локально и будут отправлены при подключении к сети.");
        } finally {
            setSavingLocation(false);
        }
    }

    async function handleDeleteLocation() {
        if (
            !window.confirm(
                `Удалить локацию «${location.name}» вместе со всеми замерами?`
            )
        ) {
            return;
        }

        try {
            setDeletingLocation(true);
            setLocationError("");

            await deleteLocation(location);

            onLocationDeleted(location.id);
        } catch (err) {
            console.error(err);
            setLocationError("Не удалось удалить локацию.");
            setDeletingLocation(false);
        }
    }

    function openCreateMeasurement() {
        setEditingMeasurement(null);
        setMeasurementError("");
        setMeasurementMode("create");
    }

    function openEditMeasurement(measurement: Measurement) {
        setEditingMeasurement(measurement);
        setMeasurementError("");
        setMeasurementMode("edit");
    }

    function closeMeasurementForm() {
        setMeasurementMode("closed");
        setEditingMeasurement(null);
        setMeasurementError("");
    }

    function useCurrentLocation() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            position => setLocationCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            () => setLocationError("Не удалось получить местоположение. Разрешите доступ к геолокации."),
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
        );
    }

    async function handleCreateMeasurement(values: MeasurementFormValues) {
        try {
            setSavingMeasurement(true);
            setMeasurementError("");

            const created = await createMeasurement(
                location,
                buildMeasurementRequest(values)
            );

            setMeasurements((previous) => [...previous, created]);
            closeMeasurementForm();
        } catch (err) {
            console.error(err);
            setMeasurementError("Не удалось создать замер.");
        } finally {
            setSavingMeasurement(false);
        }
    }

    async function handleUpdateMeasurement(values: MeasurementFormValues) {
        if (!editingMeasurement) return;

        try {
            setSavingMeasurement(true);
            setMeasurementError("");

            const updated = await updateMeasurement(
                location,
                editingMeasurement,
                buildMeasurementRequest(values)
            );

            setMeasurements((previous) =>
                previous.map((m) =>
                    m.id === editingMeasurement.id ? updated : m
                )
            );

            closeMeasurementForm();
        } catch (err) {
            console.error(err);
            setMeasurementError("Не удалось обновить замер.");
        } finally {
            setSavingMeasurement(false);
        }
    }

    async function handleDeleteMeasurement(measurement: Measurement) {
        if (!window.confirm("Удалить этот замер?")) {
            return;
        }

        try {
            setDeletingMeasurementId(measurement.id);

            await deleteMeasurement(measurement);

            setMeasurements((previous) =>
                previous.filter((m) => m.id !== measurement.id)
            );
        } catch (err) {
            console.error(err);
            alert("Не удалось удалить замер.");
        } finally {
            setDeletingMeasurementId(null);
        }
    }

    return (
        <div className="ldp">
            <div className="ldp-header">
                <div>
                    <h3 className="ldp-title">{location.name}</h3>
                    <p className="ldp-coords">
                        {location.latitude.toFixed(4)},{" "}
                        {location.longitude.toFixed(4)}
                    </p>
                </div>

                <button
                    type="button"
                    className="ldp-close"
                    onClick={onClose}
                    aria-label="Закрыть"
                >
                    ×
                </button>
            </div>

            {locationError && <p className="ldp-error">{locationError}</p>}

            {isOwner && (
                <div className="ldp-actions">
                    <button
                        type="button"
                        className="ldp-button"
                        onClick={() =>
                            setEditingLocation((previous) => !previous)
                        }
                    >
                        {editingLocation
                            ? "Отменить"
                            : "Редактировать локацию"}
                    </button>

                    <button
                        type="button"
                        className="ldp-button ldp-button-danger"
                        onClick={handleDeleteLocation}
                        disabled={deletingLocation}
                    >
                        {deletingLocation ? "Удаление..." : "Удалить локацию"}
                    </button>

                    <button
                        type="button"
                        className="ldp-button"
                        onClick={() =>
                            measurementMode === "create"
                                ? closeMeasurementForm()
                                : openCreateMeasurement()
                        }
                    >
                        {measurementMode === "create"
                            ? "Отменить"
                            : "Добавить замер"}
                    </button>
                </div>
            )}

            {editingLocation && (
                <LocationForm
                    latitude={locationCoords.latitude}
                    longitude={locationCoords.longitude}
                    onChange={(lat, lon) =>
                        setLocationCoords({
                            latitude: lat,
                            longitude: lon,
                        })
                    }
                    initialName={location.name}
                    onUseCurrentLocation={useCurrentLocation}
                    submitLabel={
                        savingLocation ? "Сохранение..." : "Сохранить"
                    }
                    onSubmit={handleUpdateLocation}
                    onCancel={() => setEditingLocation(false)}
                />
            )}

            {measurementMode === "create" && (
                <MeasurementForm
                    title="Новый замер"
                    submitLabel="Создать замер"
                    submitting={savingMeasurement}
                    error={measurementError}
                    onSubmit={handleCreateMeasurement}
                    onCancel={closeMeasurementForm}
                />
            )}

            {measurementMode === "edit" && editingMeasurement && (
                <MeasurementForm
                    key={editingMeasurement.id}
                    title="Изменить замер"
                    submitLabel="Сохранить изменения"
                    submitting={savingMeasurement}
                    error={measurementError}
                    initialValues={measurementToFormValues(
                        editingMeasurement
                    )}
                    onSubmit={handleUpdateMeasurement}
                    onCancel={closeMeasurementForm}
                />
            )}

            <div className="ldp-measurements">
                <h4 className="ldp-measurements-title">
                    Замеры ({measurements.length})
                </h4>

                {loading ? (
                    <p className="ldp-loading">Загрузка...</p>
                ) : (
                    <MeasurementList
                        measurements={measurements}
                        onEdit={isOwner ? openEditMeasurement : undefined}
                        onDelete={isOwner ? handleDeleteMeasurement : undefined}
                        deletingId={deletingMeasurementId}
                    />
                )}
            </div>
        </div>
    );
}

export default LocationDetailsPanel;

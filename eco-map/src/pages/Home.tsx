import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createLocation, loadLocations as loadOfflineLocations, loadMeasurements, startSync } from "../api/offlineData";
import MapView from "../components/map/MapView";
import { useAuth } from "../api/AuthContext";
import { useTheme } from "../api/ThemeContext";
import LocationForm from "../components/locations/LocationForm";
import LocationDetailsPanel from "../components/locations/LocationDetailsPanel";
import LocationPopupSummary from "../components/map/LocationPopupSummary";
import ObjectsListPanel from "../components/explorer/ObjectsListPanel";
import EcoMonitorButton from "../components/common/EcoMonitorButton";
import ThemeToggle from "../components/common/ThemeToggle";
import type { Location } from "../types/Location";
import type { Measurement } from "../types/Measurement";
import "./Home.css";

type ExplorerTab = "map" | "list";

function Home() {
    const { user } = useAuth();
    const { theme } = useTheme();

    const [locations, setLocations] = useState<Location[]>([]);

    const [coordinates, setCoordinates] = useState({
        latitude: 0,
        longitude: 0
    });

    const [showCreateForm, setShowCreateForm] = useState(false);

    const [selectedLocation, setSelectedLocation] =
        useState<Location | null>(null);

    const [selectedLatest, setSelectedLatest] =
        useState<Measurement | null>(null);

    const [selectedLoading, setSelectedLoading] = useState(false);

    const [tab, setTab] = useState<ExplorerTab>("map");

    async function loadLocations() {
        setLocations(await loadOfflineLocations());
    }

    useEffect(() => {
        void loadLocations();
        return startSync(() => void loadLocations());
    }, []);

    async function addLocation(name: string) {
        if (!name.trim()) {
            return;
        }

        const created = await createLocation(name, coordinates.latitude, coordinates.longitude, user?.id);
        setLocations(previous => [...previous.filter(l => l.id !== created.id), created]);

        setShowCreateForm(false);

        setCoordinates({
            latitude: 0,
            longitude: 0
        });
    }

    function useCurrentLocation() {
        if (!navigator.geolocation) {
            alert("Геолокация не поддерживается этим устройством.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            position => setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            () => alert("Не удалось получить местоположение. Проверьте разрешение браузера."),
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
        );
    }

    function handleMapClick(lat: number, lon: number) {
        setCoordinates({
            latitude: lat,
            longitude: lon
        });

        // Клик по пустому месту закрывает сводку по ранее выбранной локации
        setSelectedLocation(null);
        setSelectedLatest(null);
    }

    async function handleLocationClick(clicked: {
        id: number;
        name: string;
        latitude: number;
        longitude: number;
    }) {
        const full =
            locations.find((l) => l.id === clicked.id) ??
            (clicked as Location);

        setSelectedLocation(full);
        setShowCreateForm(false);
        setSelectedLoading(true);
        setSelectedLatest(null);

        try {
            const data = await loadMeasurements(full);

            const latest = data.reduce<Measurement | null>(
                (acc, measurement) => {
                    const time =
                        measurement.measurementTime ??
                        measurement.creationDate;

                    if (!acc) {
                        return measurement;
                    }

                    const accTime = acc.measurementTime ?? acc.creationDate;

                    return new Date(time).getTime() >
                        new Date(accTime).getTime()
                        ? measurement
                        : acc;
                },
                null
            );

            setSelectedLatest(latest);
        } catch (err) {
            console.error(err);
        } finally {
            setSelectedLoading(false);
        }
    }

    function closePopup() {
        setSelectedLocation(null);
        setSelectedLatest(null);
    }

    function handleLocationUpdated(updated: Location) {
        setLocations((previous) =>
            previous.map((l) => (l.id === updated.id ? updated : l))
        );

        setSelectedLocation(updated);
    }

    function handleLocationDeleted(id: number) {
        setLocations((previous) => previous.filter((l) => l.id !== id));
        setSelectedLocation(null);
        setSelectedLatest(null);
    }

    function handleSelectFromList(location: Location) {
        setTab("map");
        void handleLocationClick(location);
    }

    return (
        <div className="home">

            {/* Верхняя плашка */}
            <header className="home-header">
                <div className="home-header-left">
                    <EcoMonitorButton />
                </div>

                <div className="home-header-actions">
                    <ThemeToggle />

                    {user ? (
                        <Link to="/profile" className="home-profile-link">
                            <span className="home-profile-avatar">
                                {user.username.charAt(0).toUpperCase()}
                            </span>
                            {user.username}
                        </Link>
                    ) : (
                        <Link to="/login" className="home-profile-link">
                            Войти
                        </Link>
                    )}
                </div>
            </header>


            {/* Карта */}
            <main className="home-map">
                <MapView
                    locations={locations}
                    onMapClick={handleMapClick}
                    onLocationClick={handleLocationClick}
                    selectedLocationId={selectedLocation?.id ?? null}
                    theme={theme}
                    popupContent={
                        selectedLocation ? (
                            <LocationPopupSummary
                                location={selectedLocation}
                                latestMeasurement={selectedLatest}
                                loading={selectedLoading}
                                onClose={closePopup}
                            />
                        ) : undefined
                    }
                />
            </main>


            {/* Панель объектов доступна и гостям; изменения требуют входа. */}
            <section className="explorer-panel explorer-panel-open">
                    <div className="explorer-header">

                        <h2 className="explorer-title">
                            Панель исследователя
                        </h2>

                        <div className="explorer-actions">

                            <div className="explorer-tabs">
                                <button
                                    type="button"
                                    className={`explorer-tab ${tab === "map"
                                            ? "explorer-tab-active"
                                            : ""
                                        }`}
                                    onClick={() => setTab("map")}
                                >
                                    Карта
                                </button>

                                <button
                                    type="button"
                                    className={`explorer-tab ${tab === "list"
                                            ? "explorer-tab-active"
                                            : ""
                                        }`}
                                    onClick={() => setTab("list")}
                                >
                                    Все объекты
                                </button>
                            </div>

                            {user && tab === "map" && !selectedLocation && (
                                <button
                                    className="explorer-button"
                                    onClick={() =>
                                        setShowCreateForm((previous) => !previous)
                                    }
                                >
                                    {showCreateForm
                                        ? "Отменить"
                                        : "+ Добавить локацию"}
                                </button>
                            )}

                        </div>
                    </div>

                    <div className="explorer-panel-scroll">

                        {tab === "map" && (
                            <>
                                {showCreateForm && !selectedLocation && (
                                    <div className="location-form-wrapper">
                                        <LocationForm
                                            latitude={coordinates.latitude}
                                            longitude={coordinates.longitude}

                                            onChange={(lat, lon) => {
                                                setCoordinates({
                                                    latitude: lat,
                                                    longitude: lon
                                                });
                                            }}
                                            onUseCurrentLocation={useCurrentLocation}

                                            submitLabel="Сохранить"

                                            onSubmit={(name) =>
                                                addLocation(name)
                                            }

                                            onCancel={() =>
                                                setShowCreateForm(false)
                                            }
                                        />
                                    </div>
                                )}

                                {!showCreateForm && !selectedLocation && (
                                    <p className="explorer-selected-hint">
                                        {user ? "Кликните по карте, чтобы выбрать координаты для новой локации, или кликните по существующей метке, чтобы посмотреть детали и замеры." : "Кликните по метке на карте или выберите объект из списка, чтобы посмотреть сведения и замеры."}
                                    </p>
                                )}

                                {selectedLocation && (
                                    <LocationDetailsPanel
                                        key={selectedLocation.id}
                                        location={selectedLocation}
                                        currentUserId={user?.id}
                                        onLocationUpdated={
                                            handleLocationUpdated
                                        }
                                        onLocationDeleted={
                                            handleLocationDeleted
                                        }
                                        onClose={closePopup}
                                    />
                                )}
                            </>
                        )}

                        {tab === "list" && (
                            <ObjectsListPanel
                                locations={locations}
                                onSelectLocation={handleSelectFromList}
                            />
                        )}

                    </div>
            </section>

        </div>
    );
}

export default Home;

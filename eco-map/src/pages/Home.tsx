import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import MapView from "../components/map/MapView";
import { useAuth } from "../api/AuthContext";
import LocationForm from "../components/locations/LocationForm";
import "./Home.css";

interface Location {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    userId: number;
}

function Home() {
    const { user } = useAuth();

    const [locations, setLocations] = useState<Location[]>([]);

    const [coordinates, setCoordinates] = useState({
        latitude: 0,
        longitude: 0
    });

    const [showForm, setShowForm] = useState(false);

    const [isExplorerOpen, setIsExplorerOpen] = useState(true);

    async function loadLocations() {
        const response = await api.get("/Location");

        setLocations(response.data);
    }

    async function addLocation(name: string) {
        await api.post("/Location", {
            name,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
        });

        await loadLocations();

        setShowForm(false);

        setCoordinates({
            latitude: 0,
            longitude: 0
        });
    }

    useEffect(() => {
        loadLocations();
    }, []);

    return (
        <div className="home">

            {/* Верхняя плашка */}
            <header className="home-header">
                <h1 className="home-title">
                    EcoMonitor
                </h1>

                <div className="home-header-actions">
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
                    onMapClick={(lat, lon) => {
                        setCoordinates({
                            latitude: lat,
                            longitude: lon
                        });
                    }}
                />
            </main>


            {/* Панель исследователя */}
            {user && (
                <section
                    className={`explorer-panel ${isExplorerOpen
                            ? "explorer-panel-open"
                            : "explorer-panel-closed"
                        }`}
                >
                    <div className="explorer-header">

                        <h2 className="explorer-title">
                            Панель исследователя
                        </h2>

                        <div className="explorer-actions">

                            <button
                                className="explorer-button"
                                onClick={() => setShowForm(true)}
                            >
                                + Добавить локацию
                            </button>

                            <button
                                className="explorer-toggle"
                                onClick={() =>
                                    setIsExplorerOpen(!isExplorerOpen)
                                }
                                aria-label={
                                    isExplorerOpen
                                        ? "Свернуть панель"
                                        : "Развернуть панель"
                                }
                            >
                                {isExplorerOpen ? "⌄" : "⌃"}
                            </button>

                        </div>
                    </div>

                    {isExplorerOpen && showForm && (
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

                                onSubmit={(name) =>
                                    addLocation(name)
                                }
                            />

                        </div>
                    )}
                </section>
            )}

        </div>
    );
}

export default Home;
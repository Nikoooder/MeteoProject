import { useEffect, useState } from "react";
import { api } from "../api/api";

interface Sensor {
    id: number;
    name: string;
    locationId: number;
}

interface Location {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    sensors: Sensor[];
}

function Home() {
    const [locations, setLocations] = useState<Location[]>([]);

    const [name, setName] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    const [error, setError] = useState("");

    async function loadLocations() {
        try {
            const response = await api.get("/api/Location");

            console.log("GET response:", response.data);

            setLocations(response.data);
        } catch (err) {
            console.error("GET error:", err);
            setError("Не удалось загрузить локации");
        }
    }

    useEffect(() => {
        loadLocations();
    }, []);

    async function addLocation() {
        try {
            const location = {
                name,
                latitude: Number(latitude),
                longitude: Number(longitude),
                sensors: []
            };

            console.log("Отправляем:", location);

            const postResponse = await api.post(
                "/api/Location",
                location
            );

            console.log("Ответ POST:", postResponse.data);

            const getResponse = await api.get(
                "/api/Location"
            );

            console.log("Ответ GET после POST:", getResponse.data);

            setLocations(getResponse.data);

            setName("");
            setLatitude("");
            setLongitude("");

        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div
            style={{
                padding: "30px",
                fontFamily: "Arial, sans-serif"
            }}
        >
            <h1>EcoMonitor</h1>

            <h2>Добавить локацию</h2>

            <div>
                <input
                    type="text"
                    placeholder="Название"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <br />

            <div>
                <input
                    type="number"
                    placeholder="Широта"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                />
            </div>

            <br />

            <div>
                <input
                    type="number"
                    placeholder="Долгота"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                />
            </div>

            <br />

            <button onClick={addLocation}>
                Добавить
            </button>

            {error && (
                <p style={{ color: "red" }}>
                    {error}
                </p>
            )}

            <hr />

            <h2>Локации</h2>

            {locations.length === 0 && (
                <p>
                    Локаций пока нет
                </p>
            )}

            {locations.map((location) => (
                <div
                    key={location.id}
                    style={{
                        border: "1px solid #ccc",
                        padding: "10px",
                        marginBottom: "10px"
                    }}
                >
                    <h3>
                        {location.name}
                    </h3>

                    <p>
                        Широта: {location.latitude}
                    </p>

                    <p>
                        Долгота: {location.longitude}
                    </p>

                    <p>
                        Сенсоры: {location.sensors?.length ?? 0}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default Home;
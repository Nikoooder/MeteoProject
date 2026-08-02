import { useEffect, useState } from "react";
import { api } from "../api/api";

interface Location {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    userId: number;
}

function Home() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [error, setError] = useState("");

    const [newLocation, setNewLocation] = useState({
        name: "",
        latitude: 0,
        longitude: 0
    });


    async function loadLocations() {
        try {
            const response = await api.get("/Location");

            console.log("Локации:", response.data);

            setLocations(response.data);

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить локации");
        }
    }


    async function addLocation() {
        try {

            await api.post("/Location", newLocation);

            await loadLocations();

            setNewLocation({
                name: "",
                latitude: 0,
                longitude: 0
            });

        } catch (err) {
            console.error(err);
            setError("Не удалось добавить локацию");
        }
    }


    async function deleteLocation(id: number) {
        try {

            await api.delete(`/Location/${id}`);

            await loadLocations();

        } catch (err) {
            console.error(err);
            setError("Не удалось удалить локацию");
        }
    }


    useEffect(() => {
        loadLocations();
    }, []);


    return (
        <div style={{
            padding: "30px",
            fontFamily: "Arial"
        }}>

            <h1>
                EcoMonitor
            </h1>


            <h2>
                Добавить локацию
            </h2>


            <input
                placeholder="Название"
                value={newLocation.name}
                onChange={(e) =>
                    setNewLocation({
                        ...newLocation,
                        name: e.target.value
                    })
                }
            />

            <br /><br />


            <input
                type="number"
                placeholder="Широта"
                value={newLocation.latitude}
                onChange={(e) =>
                    setNewLocation({
                        ...newLocation,
                        latitude: Number(e.target.value)
                    })
                }
            />

            <br /><br />


            <input
                type="number"
                placeholder="Долгота"
                value={newLocation.longitude}
                onChange={(e) =>
                    setNewLocation({
                        ...newLocation,
                        longitude: Number(e.target.value)
                    })
                }
            />

            <br /><br />


            <button onClick={addLocation}>
                Добавить локацию
            </button>


            {
                error &&
                <p style={{ color: "red" }}>
                    {error}
                </p>
            }


            <hr />


            <h2>
                Локации
            </h2>


            {
                locations.map(location => (

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
                            Пользователь: {location.userId}
                        </p>


                        <button
                            onClick={() =>
                                deleteLocation(location.id)
                            }
                        >
                            Удалить
                        </button>

                    </div>

                ))
            }

        </div>
    );
}

export default Home;
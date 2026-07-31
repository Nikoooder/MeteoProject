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
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);

    const [newLocation, setNewLocation] = useState<Location>({
        id: 0,
        name: "",
        latitude: 0,
        longitude: 0,
        sensors: []
    });

    const [sensorName, setSensorName] = useState("");

    const [error, setError] = useState("");



    async function loadLocations() {
        try {
            const response = await api.get("/api/Location");

            const data = response.data.map((item) => ({
                ...item,
                sensors: item.sensors ?? []
            }));

            console.log("Полученные локации:", data);

            setLocations(data);

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить локации");
        }
    }

    async function updateLocation() {
        if (!editingLocation) return;

        try {
            await api.put(
                `/api/Location/${editingLocation.id}`,
                editingLocation
            );

            await loadLocations();

            setEditingLocation(null);

        } catch (err) {
            console.error(err);
            setError("Не удалось обновить локацию");
        }
    }

    function updateSensor(index: number, value: string) {
        if (!editingLocation) return;

        const updatedSensors = [...editingLocation.sensors];

        updatedSensors[index] = {
            ...updatedSensors[index],
            name: value
        };

        setEditingLocation({
            ...editingLocation,
            sensors: updatedSensors
        });
    }


    function addEditSensor() {
        if (!editingLocation) return;

        setEditingLocation({
            ...editingLocation,
            sensors: [
                ...editingLocation.sensors,
                {
                    id: 0,
                    name: "Новый сенсор",
                    locationId: editingLocation.id
                }
            ]
        });
    }


    function deleteEditSensor(index: number) {
        if (!editingLocation) return;

        setEditingLocation({
            ...editingLocation,
            sensors: editingLocation.sensors.filter(
                (_, i) => i !== index
            )
        });
    }


    useEffect(() => {
        const fetchLocations = async () => {
            await loadLocations();
        };

        fetchLocations();
    }, []);



    function addSensor() {

        if (!sensorName.trim()) {
            return;
        }


        const sensor: Sensor = {
            id: 0,
            name: sensorName,
            locationId: 0
        };


        setNewLocation(prev => {

            const updated = {
                ...prev,
                sensors: [
                    ...prev.sensors,
                    sensor
                ]
            };


            console.log(
                "Локация с сенсором:",
                updated
            );


            return updated;
        });


        setSensorName("");
    }



    function removeSensor(index: number) {

        setNewLocation(prev => ({
            ...prev,
            sensors: prev.sensors.filter(
                (_, i) => i !== index
            )
        }));

    }



    async function addLocation() {

        try {

            console.log(
                "POST отправка:",
                newLocation
            );


            await api.post(
                "/api/Location",
                newLocation
            );


            await loadLocations();


            setNewLocation({
                id: 0,
                name: "",
                latitude: 0,
                longitude: 0,
                sensors: []
            });


            setError("");

        } catch (err) {

            console.error(err);
            setError("Не удалось добавить локацию");

        }

    }


    async function deleteLocation(id: number) {
        try {
            await api.delete(`/api/Location/${id}`);

            await loadLocations();
        }
        catch (err) {
            console.error(err);
        }
    }


    return (
        <div
            style={{
                padding: "30px",
                fontFamily: "Arial"
            }}
        >

            <h1>
                EcoMonitor
            </h1>


            <h2>
                Добавить локацию
            </h2>



            <input
                type="text"
                placeholder="Название"
                value={newLocation.name}
                onChange={(e) =>
                    setNewLocation(prev => ({
                        ...prev,
                        name: e.target.value
                    }))
                }
            />


            <br /><br />



            <input
                type="number"
                placeholder="Широта"
                value={newLocation.latitude}
                onChange={(e) =>
                    setNewLocation(prev => ({
                        ...prev,
                        latitude: Number(e.target.value)
                    }))
                }
            />


            <br /><br />



            <input
                type="number"
                placeholder="Долгота"
                value={newLocation.longitude}
                onChange={(e) =>
                    setNewLocation(prev => ({
                        ...prev,
                        longitude: Number(e.target.value)
                    }))
                }
            />



            <h3>
                Сенсоры
            </h3>



            <input
                type="text"
                placeholder="Название сенсора"
                value={sensorName}
                onChange={(e) =>
                    setSensorName(e.target.value)
                }
            />



            <button
                type="button"
                onClick={addSensor}
                style={{
                    marginLeft: "10px"
                }}
            >
                Добавить сенсор
            </button>



            {
                newLocation.sensors.length > 0 &&
                (
                    <ul>

                        {
                            newLocation.sensors.map(
                                (sensor, index) => (

                                    <li key={index}>

                                        {sensor.name}


                                        <button
                                            type="button"
                                            style={{
                                                marginLeft: "10px"
                                            }}
                                            onClick={() =>
                                                removeSensor(index)
                                            }
                                        >
                                            Удалить
                                        </button>

                                    </li>

                                )
                            )
                        }

                    </ul>
                )
            }



            <br />


            <button
                type="button"
                onClick={addLocation}
            >
                Добавить локацию
            </button>

            {editingLocation && (
                <div
                    style={{
                        border: "1px solid #999",
                        padding: "15px",
                        marginBottom: "20px"
                    }}
                >
                    <h2>Редактирование локации</h2>

                    <input
                        type="text"
                        value={editingLocation.name}
                        placeholder="Название"
                        onChange={(e) =>
                            setEditingLocation({
                                ...editingLocation,
                                name: e.target.value
                            })
                        }
                    />

                    <br /><br />

                    <input
                        type="number"
                        value={editingLocation.latitude}
                        placeholder="Широта"
                        onChange={(e) =>
                            setEditingLocation({
                                ...editingLocation,
                                latitude: Number(e.target.value)
                            })
                        }
                    />

                    <br /><br />

                    <input
                        type="number"
                        value={editingLocation.longitude}
                        placeholder="Долгота"
                        onChange={(e) =>
                            setEditingLocation({
                                ...editingLocation,
                                longitude: Number(e.target.value)
                            })
                        }
                    />

                    <h3>Сенсоры</h3>

                    <button
                        type="button"
                        onClick={addEditSensor}
                    >
                        Добавить сенсор
                    </button>


                    <ul>
                        {
                            editingLocation.sensors.map((sensor, index) => (
                                <li key={index}>

                                    <input
                                        type="text"
                                        value={sensor.name}
                                        onChange={(e) =>
                                            updateSensor(
                                                index,
                                                e.target.value
                                            )
                                        }
                                    />


                                    <button
                                        type="button"
                                        style={{
                                            marginLeft: "10px"
                                        }}
                                        onClick={() =>
                                            deleteEditSensor(index)
                                        }
                                    >
                                        Удалить
                                    </button>

                                </li>
                            ))
                        }
                    </ul>

                    <br /><br />

                    <button onClick={updateLocation}>
                        Сохранить
                    </button>

                    <button
                        style={{ marginLeft: "10px" }}
                        onClick={() => setEditingLocation(null)}
                    >
                        Отмена
                    </button>
                </div>
            )}


            {
                error &&
                (
                    <p style={{
                        color: "red"
                    }}>
                        {error}
                    </p>
                )
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



                        <h4>
                            Сенсоры:
                        </h4>


                        {
                            location.sensors.length === 0
                                ?
                                <p>
                                    Нет сенсоров
                                </p>
                                :
                                <ul>

                                    {
                                        location.sensors.map(sensor => (

                                            <li key={sensor.id}>
                                                {sensor.name}
                                            </li>

                                        ))
                                    }

                                </ul>
                        }

                        <button
                            type="button"
                            onClick={() =>
                                setEditingLocation({
                                    ...location
                                })
                            }
                        >
                            Редактировать локацию
                        </button>

                        <button
                            onClick={() => deleteLocation(location.id)}
                        >
                            Удалить локацию
                        </button>


                    </div>

                ))
            }


        </div>

    );


}

export default Home;

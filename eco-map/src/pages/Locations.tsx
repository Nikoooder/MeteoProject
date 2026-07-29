import { useEffect, useState } from "react";
import { api } from "../api/api";
import type { Location } from "../types/Location";

function Locations() {
    const [locations, setLocations] = useState<Location[]>([]);

    useEffect(() => {
        api.get("/api/Location")
            .then(res => setLocations(res.data));
    }, []);

    return (
        <div>
            <h1>Локации</h1>

            {locations.map(location => (
                <div key={location.id}>
                    <h2>{location.name}</h2>

                    <p>
                        {location.latitude}, {location.longitude}
                    </p>

                    <p>
                        Сенсоров: {location.sensors.length}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default Locations;
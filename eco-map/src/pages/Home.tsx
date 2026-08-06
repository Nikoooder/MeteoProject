import { useEffect, useState } from "react";
import { api } from "../api/api";
import MapView from "../components/map/MapView";
import { useAuth } from "../api/AuthContext";
import LocationForm from "../components/locations/LocationForm";


interface Location {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    userId: number;
}


function Home() {

    const { user } = useAuth();


    const [locations, setLocations] =
        useState<Location[]>([]);


    const [coordinates, setCoordinates] =
        useState({

            latitude: 0,

            longitude: 0

        });


    const [showForm, setShowForm] =
        useState(false);



    async function loadLocations() {

        const response =
            await api.get("/Location");


        setLocations(
            response.data
        );

    }



    async function addLocation(
        name: string
    ) {

        await api.post(
            "/Location",
            {

                name,

                latitude:
                    coordinates.latitude,

                longitude:
                    coordinates.longitude

            }
        );


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

        <div>


            <h1>
                EcoMonitor
            </h1>



            <MapView

                locations={locations}


                onMapClick={(lat, lon) => {

                    setCoordinates({

                        latitude: lat,

                        longitude: lon

                    });

                }}

            />



            {
                user && (

                    <div>


                        <h2>
                            Панель исследователя
                        </h2>



                        <button

                            onClick={() =>
                                setShowForm(true)
                            }

                        >

                            Добавить локацию
                        </button>



                        {
                            showForm && (

                                <LocationForm

                                    latitude={
                                        coordinates.latitude
                                    }


                                    longitude={
                                        coordinates.longitude
                                    }


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

                            )
                        }


                    </div>

                )
            }


        </div>

    );

}


export default Home;
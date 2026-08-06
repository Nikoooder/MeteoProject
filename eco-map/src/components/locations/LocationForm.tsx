import { useState } from "react";


interface Props {

    latitude: number;

    longitude: number;

    onChange: (
        latitude: number,
        longitude: number
    ) => void;

    onSubmit?: (name: string) => void;

}


function LocationForm({
    latitude,
    longitude,
    onChange,
    onSubmit
}: Props) {


    const [name, setName] =
        useState("");



    return (

        <div
            style={{
                padding: "20px",
                borderTop: "1px solid #ccc"
            }}
        >

            <h2>
                Добавить локацию
            </h2>


            <div>

                <label>
                    Название:
                </label>


                <br />


                <input

                    value={name}

                    onChange={(e) =>
                        setName(
                            e.target.value
                        )
                    }

                    placeholder="Название точки"

                />

            </div>


            <br />


            <div>

                <label>
                    Широта:
                </label>


                <br />


                <input

                    type="number"

                    value={latitude}

                    onChange={(e) =>
                        onChange(
                            Number(e.target.value),
                            longitude
                        )
                    }

                />

            </div>


            <br />


            <div>

                <label>
                    Долгота:
                </label>


                <br />


                <input

                    type="number"

                    value={longitude}

                    onChange={(e) =>
                        onChange(
                            latitude,
                            Number(e.target.value)
                        )
                    }

                />

            </div>


            <br />


            <button
                onClick={() => onSubmit?.(name)}
            >
                Сохранить
            </button>


        </div>

    );

}


export default LocationForm;
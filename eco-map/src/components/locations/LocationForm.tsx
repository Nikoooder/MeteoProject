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
    const [name, setName] = useState("");

    return (
        <div className="location-form-container">

            {/*<h2 className="location-form-title">*/}
            {/*    Добавить локацию*/}
            {/*</h2>*/}

            <div className="location-form">

                <div className="location-field location-name">
                    <label>
                        Название
                    </label>

                    <input
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                        placeholder="Название точки"
                    />
                </div>


                <div className="location-field">
                    <label>
                        Широта
                    </label>

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


                <div className="location-field">
                    <label>
                        Долгота
                    </label>

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


                <button
                    className="location-submit"
                    onClick={() => onSubmit?.(name)}
                >
                    Сохранить
                </button>

            </div>

        </div>
    );
}

export default LocationForm;


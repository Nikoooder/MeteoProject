import { useState } from "react";

interface Props {
    latitude: number;
    longitude: number;

    onChange: (
        latitude: number,
        longitude: number
    ) => void;

    onSubmit?: (name: string) => void;
    onCancel?: () => void;

    initialName?: string;
    submitLabel?: string;
    onUseCurrentLocation?: () => void;
    locating?: boolean;
}

function LocationForm({
    latitude,
    longitude,
    onChange,
    onSubmit,
    onCancel,
    initialName = "",
    submitLabel = "Сохранить",
    onUseCurrentLocation,
    locating = false
}: Props) {
    const [name, setName] = useState(initialName);

    return (
        <div className="location-form-container">

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

                <div className="location-form-buttons">
                    {onUseCurrentLocation && (
                        <button type="button" className="location-geolocation" onClick={onUseCurrentLocation} disabled={locating}>
                            {locating ? "Определяем..." : "Моё местоположение"}
                        </button>
                    )}
                    {onCancel && (
                        <button
                            type="button"
                            className="location-cancel"
                            onClick={onCancel}
                        >
                            Отменить
                        </button>
                    )}

                    <button
                        className="location-submit"
                        onClick={() => onSubmit?.(name)}
                        disabled={!name.trim()}
                    >
                        {submitLabel}
                    </button>
                </div>

            </div>

        </div>
    );
}

export default LocationForm;

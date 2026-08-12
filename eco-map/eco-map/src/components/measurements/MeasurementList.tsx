import type { Measurement } from "../../types/Measurement";
import { formatDate } from "../../utils/format";
import "./MeasurementList.css";

interface Props {
    measurements: Measurement[];
    onEdit?: (measurement: Measurement) => void;
    onDelete?: (measurement: Measurement) => void;
    deletingId?: number | null;
    locationNameById?: Record<number, string>;
    emptyText?: string;
}

function MeasurementList({
    measurements,
    onEdit,
    onDelete,
    deletingId = null,
    locationNameById,
    emptyText = "Замеров пока нет.",
}: Props) {
    if (measurements.length === 0) {
        return <p className="ml-empty">{emptyText}</p>;
    }

    const showActions = Boolean(onEdit || onDelete);

    return (
        <div className="ml-table-wrapper">
            <table className="ml-table">
                <thead>
                    <tr>
                        <th>Время</th>
                        {locationNameById && <th>Локация</th>}
                        <th>Датчик</th>
                        <th>T, °C</th>
                        <th>Влажность, %</th>
                        <th>CO₂</th>
                        <th>PM2.5</th>
                        <th>PM10</th>
                        <th>Ветер</th>
                        <th>Комментарий</th>
                        {showActions && <th>Действия</th>}
                    </tr>
                </thead>

                <tbody>
                    {measurements.map((measurement) => (
                        <tr key={measurement.id}>
                            <td>
                                {formatDate(
                                    measurement.measurementTime ??
                                        measurement.creationDate
                                )}
                            </td>

                            {locationNameById && (
                                <td>
                                    {locationNameById[
                                        measurement.locationId
                                    ] ?? "—"}
                                </td>
                            )}

                            <td>{measurement.sensorName || "—"}</td>
                            <td>{measurement.airTemperature ?? "—"}</td>
                            <td>{measurement.humidity ?? "—"}</td>
                            <td>{measurement.cO2 ?? "—"}</td>
                            <td>{measurement.pM25 ?? "—"}</td>
                            <td>{measurement.pM10 ?? "—"}</td>
                            <td>
                                {measurement.windSpeed ?? "—"}
                                {measurement.windDirection
                                    ? ` ${measurement.windDirection}`
                                    : ""}
                            </td>
                            <td>{measurement.comment || "—"}</td>

                            {showActions && (
                                <td className="ml-actions">
                                    {onEdit && (
                                        <button
                                            type="button"
                                            className="ml-action-button"
                                            onClick={() =>
                                                onEdit(measurement)
                                            }
                                        >
                                            Изменить
                                        </button>
                                    )}

                                    {onDelete && (
                                        <button
                                            type="button"
                                            className="ml-action-button ml-action-danger"
                                            onClick={() =>
                                                onDelete(measurement)
                                            }
                                            disabled={
                                                deletingId === measurement.id
                                            }
                                        >
                                            {deletingId === measurement.id
                                                ? "..."
                                                : "Удалить"}
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default MeasurementList;

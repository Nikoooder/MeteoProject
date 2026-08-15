import type { Location } from "../../types/Location";
import type { Measurement } from "../../types/Measurement";
import { formatDate } from "../../utils/format";
import "./LocationPopupSummary.css";

interface Props {
    location: Location;
    latestMeasurement: Measurement | null;
    loading: boolean;
    onClose: () => void;
}

function LocationPopupSummary({
    location,
    latestMeasurement,
    loading,
    onClose,
}: Props) {
    return (
        <div className="lps">
            <div className="lps-header">
                <span className="lps-name">{location.name}</span>

                <button
                    type="button"
                    className="lps-close"
                    onClick={onClose}
                    aria-label="Закрыть"
                >
                    ×
                </button>
            </div>

            <p className="lps-coords">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>

            {loading && <p className="lps-status">Загрузка данных...</p>}

            {!loading && !latestMeasurement && (
                <p className="lps-status">Для этой локации пока нет замеров.</p>
            )}

            {!loading && latestMeasurement && (
                <>
                    <p className="lps-time">
                        {formatDate(
                            latestMeasurement.measurementTime ??
                                latestMeasurement.creationDate
                        )}
                    </p>

                    <div className="lps-grid">
                        <div className="lps-metric">
                            <span className="lps-metric-value">
                                {latestMeasurement.cO2 ?? "—"}
                            </span>
                            <span className="lps-metric-label">CO₂</span>
                        </div>

                        <div className="lps-metric">
                            <span className="lps-metric-value">
                                {latestMeasurement.pM25 ?? "—"}
                            </span>
                            <span className="lps-metric-label">PM2.5</span>
                        </div>

                        <div className="lps-metric">
                            <span className="lps-metric-value">
                                {latestMeasurement.airTemperature ?? "—"}
                            </span>
                            <span className="lps-metric-label">°C</span>
                        </div>

                        <div className="lps-metric">
                            <span className="lps-metric-value">
                                {latestMeasurement.humidity ?? "—"}
                            </span>
                            <span className="lps-metric-label">Влажность %</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default LocationPopupSummary;

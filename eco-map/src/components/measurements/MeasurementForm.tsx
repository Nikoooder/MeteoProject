import { useState } from "react";
import type { MeasurementFormValues } from "./measurementForm.types";
import { createEmptyMeasurementForm } from "./measurementForm.types";
import "./MeasurementForm.css";

interface Props {
    initialValues?: MeasurementFormValues;
    onSubmit: (values: MeasurementFormValues) => void | Promise<void>;
    onCancel: () => void;
    submitting?: boolean;
    error?: string;
    submitLabel?: string;
    title?: string;
    description?: string;
}

function MeasurementForm({
    initialValues,
    onSubmit,
    onCancel,
    submitting = false,
    error = "",
    submitLabel = "Создать замер",
    title = "Новый замер",
    description = "Укажите параметры измерения для этой локации.",
}: Props) {
    const [form, setForm] = useState<MeasurementFormValues>(
        initialValues ?? createEmptyMeasurementForm()
    );

    function updateField(field: keyof MeasurementFormValues, value: string) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.sensorName.trim()) {
            return;
        }

        await onSubmit(form);
    }

    return (
        <form className="mf-form" onSubmit={handleSubmit}>
            <div className="mf-form-header">
                <div>
                    <h3 className="mf-form-title">{title}</h3>
                    <p className="mf-form-description">{description}</p>
                </div>
            </div>

            {error && <p className="mf-error">{error}</p>}

            <div className="mf-form-section">
                <h4 className="mf-form-section-title">Основные параметры</h4>

                <div className="mf-form-grid">
                    <label className="mf-form-label">
                        Датчик
                        <span className="mf-required">*</span>
                        <input
                            className="mf-form-input"
                            type="text"
                            value={form.sensorName}
                            onChange={(e) =>
                                updateField("sensorName", e.target.value)
                            }
                            required
                            placeholder="Например, AirSensor-01"
                        />
                    </label>

                    <label className="mf-form-label">
                        Время замера
                        <input
                            className="mf-form-input"
                            type="datetime-local"
                            value={form.measurementTime}
                            onChange={(e) =>
                                updateField("measurementTime", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        Температура, °C
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.airTemperature}
                            onChange={(e) =>
                                updateField("airTemperature", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        Влажность, %
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.humidity}
                            onChange={(e) =>
                                updateField("humidity", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        CO₂
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.cO2}
                            onChange={(e) =>
                                updateField("cO2", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        PM2.5
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.pM25}
                            onChange={(e) =>
                                updateField("pM25", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        PM10
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.pM10}
                            onChange={(e) =>
                                updateField("pM10", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        Скорость ветра
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.windSpeed}
                            onChange={(e) =>
                                updateField("windSpeed", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        Направление ветра
                        <input
                            className="mf-form-input"
                            type="text"
                            value={form.windDirection}
                            onChange={(e) =>
                                updateField("windDirection", e.target.value)
                            }
                            placeholder="Например, СЗ"
                        />
                    </label>
                </div>
            </div>

            <div className="mf-form-section">
                <h4 className="mf-form-section-title">
                    Загрязнители и дополнительные параметры
                </h4>

                <div className="mf-form-grid">
                    <label className="mf-form-label">
                        O₂
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.o2}
                            onChange={(e) => updateField("o2", e.target.value)}
                        />
                    </label>

                    <label className="mf-form-label">
                        CO
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.co}
                            onChange={(e) => updateField("co", e.target.value)}
                        />
                    </label>

                    <label className="mf-form-label">
                        SO₂
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.sO2}
                            onChange={(e) =>
                                updateField("sO2", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        NO
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.no}
                            onChange={(e) => updateField("no", e.target.value)}
                        />
                    </label>

                    <label className="mf-form-label">
                        CH
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.ch}
                            onChange={(e) => updateField("ch", e.target.value)}
                        />
                    </label>

                    <label className="mf-form-label">
                        NO₂
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.nO2}
                            onChange={(e) =>
                                updateField("nO2", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        H₂CO
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.h2CO}
                            onChange={(e) =>
                                updateField("h2CO", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        TVOC
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.tvoc}
                            onChange={(e) =>
                                updateField("tvoc", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        Атмосферное давление
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.atmosphericPressure}
                            onChange={(e) =>
                                updateField(
                                    "atmosphericPressure",
                                    e.target.value
                                )
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        Осадки
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.precipitation}
                            onChange={(e) =>
                                updateField("precipitation", e.target.value)
                            }
                        />
                    </label>

                    <label className="mf-form-label">
                        Осадки в час
                        <input
                            className="mf-form-input"
                            type="number"
                            step="any"
                            value={form.precipitationPerHour}
                            onChange={(e) =>
                                updateField(
                                    "precipitationPerHour",
                                    e.target.value
                                )
                            }
                        />
                    </label>
                </div>
            </div>

            <div className="mf-form-section">
                <label className="mf-form-label">
                    Комментарий
                    <textarea
                        className="mf-form-textarea"
                        value={form.comment}
                        onChange={(e) =>
                            updateField("comment", e.target.value)
                        }
                        rows={3}
                        placeholder="Дополнительная информация о замере"
                    />
                </label>
            </div>

            <div className="mf-form-actions">
                <button
                    type="button"
                    className="mf-cancel-button"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Отмена
                </button>

                <button
                    type="submit"
                    className="mf-submit-button"
                    disabled={submitting}
                >
                    {submitting ? "Сохранение..." : submitLabel}
                </button>
            </div>
        </form>
    );
}

export default MeasurementForm;

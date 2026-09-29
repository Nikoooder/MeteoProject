import { useMemo, useState } from "react";
import type { Measurement } from "../../types/Measurement";
import TimeSeriesChart from "./TimeSeriesChart";
import { formatValue } from "./chartFormat";
import type { ChartSeries } from "./TimeSeriesChart";
import "./LocationCharts.css";

type NumericField =
    | "airTemperature"
    | "humidity"
    | "atmosphericPressure"
    | "windSpeed"
    | "precipitation"
    | "precipitationPerHour"
    | "pM25"
    | "pM10"
    | "cO2"
    | "co"
    | "sO2"
    | "nO2"
    | "no"
    | "ch"
    | "h2CO"
    | "tvoc"
    | "o2";

interface SeriesDef {
    field: NumericField;
    label: string;
    color: string;
}

interface ChartDef {
    id: string;
    title: string;
    tab: "weather" | "air";
    // Единицы показываем только там, где они однозначны.
    unit?: string;
    series: SeriesDef[];
    // Поле, которое выводится в подсказке рядом со значением.
    noteField?: "windDirection";
}

const CHARTS: ChartDef[] = [
    {
        id: "temperature",
        title: "Температура",
        tab: "weather",
        unit: "°C",
        series: [{ field: "airTemperature", label: "Температура", color: "#e4572e" }],
    },
    {
        id: "humidity",
        title: "Влажность",
        tab: "weather",
        unit: "%",
        series: [{ field: "humidity", label: "Влажность", color: "#3b82f6" }],
    },
    {
        id: "pressure",
        title: "Атмосферное давление",
        tab: "weather",
        unit: "гПа",
        series: [
            { field: "atmosphericPressure", label: "Давление", color: "#8b5cf6" },
        ],
    },
    {
        id: "wind",
        title: "Скорость ветра",
        tab: "weather",
        unit: "м/с",
        noteField: "windDirection",
        series: [{ field: "windSpeed", label: "Скорость", color: "#0d9488" }],
    },
    {
        id: "precipitation",
        title: "Осадки",
        tab: "weather",
        unit: "мм",
        series: [{ field: "precipitation", label: "Осадки", color: "#2563eb" }],
    },
    {
        id: "precipitationPerHour",
        title: "Осадки в час",
        tab: "weather",
        unit: "мм/ч",
        series: [
            { field: "precipitationPerHour", label: "Осадки в час", color: "#0891b2" },
        ],
    },
    {
        id: "particles",
        title: "Частицы PM2.5 / PM10",
        tab: "air",
        series: [
            { field: "pM25", label: "PM2.5", color: "#f59e0b" },
            { field: "pM10", label: "PM10", color: "#b45309" },
        ],
    },
    {
        id: "co2",
        title: "CO₂",
        tab: "air",
        series: [{ field: "cO2", label: "CO₂", color: "#64748b" }],
    },
    {
        id: "co",
        title: "CO",
        tab: "air",
        series: [{ field: "co", label: "CO", color: "#dc2626" }],
    },
    {
        id: "so2",
        title: "SO₂",
        tab: "air",
        series: [{ field: "sO2", label: "SO₂", color: "#ca8a04" }],
    },
    {
        id: "no2",
        title: "NO₂",
        tab: "air",
        series: [{ field: "nO2", label: "NO₂", color: "#c2410c" }],
    },
    {
        id: "no",
        title: "NO",
        tab: "air",
        series: [{ field: "no", label: "NO", color: "#be185d" }],
    },
    {
        id: "ch",
        title: "CH",
        tab: "air",
        series: [{ field: "ch", label: "CH", color: "#7c3aed" }],
    },
    {
        id: "h2co",
        title: "H₂CO",
        tab: "air",
        series: [{ field: "h2CO", label: "H₂CO", color: "#0369a1" }],
    },
    {
        id: "tvoc",
        title: "TVOC",
        tab: "air",
        series: [{ field: "tvoc", label: "TVOC", color: "#15803d" }],
    },
    {
        id: "o2",
        title: "O₂",
        tab: "air",
        series: [{ field: "o2", label: "O₂", color: "#4f46e5" }],
    },
];

type Preset = "all" | "24h" | "7d" | "30d" | "custom";

const HOUR = 60 * 60 * 1000;

// Отдельная функция: «сейчас» нужно только в обработчике клика, не при рендере.
const currentTime = () => Date.now();

const PRESETS: { id: Preset; label: string; ms?: number }[] = [
    { id: "24h", label: "24 часа", ms: 24 * HOUR },
    { id: "7d", label: "7 дней", ms: 7 * 24 * HOUR },
    { id: "30d", label: "30 дней", ms: 30 * 24 * HOUR },
    { id: "all", label: "Всё время" },
];

interface Props {
    measurements: Measurement[];
}

// Переключатель «Таблица / Диаграммы» для панелей с замерами.
export function MeasurementsViewSwitch({
    showCharts,
    onChange,
}: {
    showCharts: boolean;
    onChange: (showCharts: boolean) => void;
}) {
    return (
        <div className="lc-switch" role="group" aria-label="Вид замеров">
            <button
                type="button"
                className={`lc-switch-button${showCharts ? "" : " lc-active"}`}
                onClick={() => onChange(false)}
            >
                Таблица
            </button>
            <button
                type="button"
                className={`lc-switch-button${showCharts ? " lc-active" : ""}`}
                onClick={() => onChange(true)}
            >
                Диаграммы
            </button>
        </div>
    );
}

function LocationCharts({ measurements }: Props) {
    // «Последние N часов» считаем от момента клика, а не при каждом рендере.
    const [preset, setPreset] = useState<Preset>("all");
    const [presetFrom, setPresetFrom] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [tab, setTab] = useState<"weather" | "air">("weather");

    function choosePreset(next: (typeof PRESETS)[number]) {
        setPreset(next.id);
        setPresetFrom(next.ms ? currentTime() - next.ms : null);
        setDateFrom("");
        setDateTo("");
    }

    function changeDate(setter: (value: string) => void, value: string) {
        setter(value);
        setPreset("custom");
        setPresetFrom(null);
    }

    // Все замеры локации с корректным временем, по возрастанию времени.
    const timed = useMemo(
        () =>
            measurements
                .filter((m) => !m.deletedAt)
                .map((m) => ({
                    m,
                    t: new Date(m.measurementTime ?? m.creationDate).getTime(),
                }))
                .filter((item) => Number.isFinite(item.t))
                .sort((a, b) => a.t - b.t),
        [measurements]
    );

    const inRange = useMemo(() => {
        let from = -Infinity;
        let to = Infinity;

        if (preset === "custom") {
            if (dateFrom) from = new Date(`${dateFrom}T00:00:00`).getTime();
            if (dateTo) to = new Date(`${dateTo}T23:59:59.999`).getTime();
        } else if (presetFrom !== null) {
            from = presetFrom;
        }

        return timed.filter((item) => item.t >= from && item.t <= to);
    }, [timed, preset, presetFrom, dateFrom, dateTo]);

    // Диаграммы, по которым есть хотя бы одно числовое значение.
    const charts = useMemo(
        () =>
            CHARTS.map((def) => {
                const series: ChartSeries[] = def.series
                    .map((seriesDef) => ({
                        key: seriesDef.field,
                        label: seriesDef.label,
                        color: seriesDef.color,
                        points: inRange.flatMap(({ m, t }) => {
                            const value = m[seriesDef.field];

                            if (
                                typeof value !== "number" ||
                                !Number.isFinite(value)
                            ) {
                                return [];
                            }

                            const note = def.noteField
                                ? (m[def.noteField] ?? undefined)
                                : undefined;

                            return [{ t, v: value, note }];
                        }),
                    }))
                    .filter((s) => s.points.length > 0);

                return { def, series };
            }).filter((chart) => chart.series.length > 0),
        [inRange]
    );

    const xMin = inRange.length > 0 ? inRange[0].t : 0;
    const xMax = inRange.length > 0 ? inRange[inRange.length - 1].t : 0;

    const weatherCount = charts.filter((c) => c.def.tab === "weather").length;
    const airCount = charts.filter((c) => c.def.tab === "air").length;

    // Если на выбранной вкладке данных нет, а на другой есть — переключаемся.
    const activeTab =
        tab === "weather" && weatherCount === 0 && airCount > 0
            ? "air"
            : tab === "air" && airCount === 0 && weatherCount > 0
              ? "weather"
              : tab;

    const visibleCharts = charts.filter((c) => c.def.tab === activeTab);

    if (timed.length === 0) {
        return (
            <p className="lc-empty">
                Для построения диаграмм нужны замеры.
            </p>
        );
    }

    return (
        <div className="lc">
            <div className="lc-toolbar">
                <div className="lc-presets" role="group" aria-label="Период">
                    {PRESETS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`lc-chip${preset === item.id ? " lc-active" : ""}`}
                            onClick={() => choosePreset(item)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="lc-dates">
                    <label className="lc-date">
                        с
                        <input
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(e) =>
                                changeDate(setDateFrom, e.target.value)
                            }
                        />
                    </label>

                    <label className="lc-date">
                        по
                        <input
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={(e) =>
                                changeDate(setDateTo, e.target.value)
                            }
                        />
                    </label>
                </div>
            </div>

            <p className="lc-summary">
                Замеров в периоде: {inRange.length} из {timed.length}
            </p>

            {inRange.length === 0 && (
                <p className="lc-empty">
                    В выбранный период замеров нет. Попробуйте «Всё время».
                </p>
            )}

            {inRange.length > 0 && charts.length === 0 && (
                <p className="lc-empty">
                    В этих замерах нет числовых значений для диаграмм.
                </p>
            )}

            {charts.length > 0 && (
                <div className="lc-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "weather"}
                        className={`lc-tab${activeTab === "weather" ? " lc-active" : ""}`}
                        onClick={() => setTab("weather")}
                        disabled={weatherCount === 0}
                    >
                        Погода
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "air"}
                        className={`lc-tab${activeTab === "air" ? " lc-active" : ""}`}
                        onClick={() => setTab("air")}
                        disabled={airCount === 0}
                    >
                        Воздух
                    </button>
                </div>
            )}

            <div className="lc-grid">
                {visibleCharts.map(({ def, series }) => (
                    <section className="lc-card" key={def.id}>
                        <h5 className="lc-card-title">
                            {def.title}
                            {def.unit ? `, ${def.unit}` : ""}
                        </h5>

                        <ul className="lc-legend">
                            {series.map((s) => {
                                const values = s.points.map((p) => p.v);
                                const last = s.points[s.points.length - 1].v;

                                return (
                                    <li key={s.key}>
                                        <span
                                            className="tsc-dot"
                                            style={{ background: s.color }}
                                        />
                                        <span className="lc-legend-label">
                                            {s.label}
                                        </span>
                                        <span className="lc-legend-stats">
                                            последнее {formatValue(last)} ·
                                            мин {formatValue(Math.min(...values))} ·
                                            макс {formatValue(Math.max(...values))}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>

                        <TimeSeriesChart
                            series={series}
                            xMin={xMin}
                            xMax={xMax}
                            unit={def.unit}
                            ariaLabel={`График: ${def.title}`}
                        />
                    </section>
                ))}
            </div>
        </div>
    );
}

export default LocationCharts;

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { formatDate } from "../../utils/format";
import { formatValue } from "./chartFormat";
import "./LocationCharts.css";

export interface ChartPoint {
    // Время в миллисекундах (Date.getTime()).
    t: number;
    v: number;
    // Подпись в подсказке (например, направление ветра).
    note?: string;
}

export interface ChartSeries {
    key: string;
    label: string;
    color: string;
    points: ChartPoint[];
}

interface Props {
    series: ChartSeries[];
    // Общий диапазон времени: у всех диаграмм одной локации ось X одинаковая.
    xMin: number;
    xMax: number;
    unit?: string;
    ariaLabel: string;
    height?: number;
}

const MARGIN_TOP = 12;
const MARGIN_RIGHT = 16;
const MARGIN_BOTTOM = 24;
const MARKERS_LIMIT = 80;

// «Красивые» значения для оси Y (1, 2, 5 × 10^n).
function niceTicks(min: number, max: number, target = 4): number[] {
    const rough = (max - min) / target;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    const fraction = rough / magnitude;
    const niceFraction =
        fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    const step = niceFraction * magnitude;

    const first = Math.floor(min / step) * step;
    const last = Math.ceil(max / step) * step;

    const ticks: number[] = [];

    for (let value = first; value <= last + step / 2; value += step) {
        ticks.push(Number(value.toPrecision(12)));
    }

    return ticks;
}

function formatTimeTick(t: number, span: number) {
    const date = new Date(t);
    const day = 24 * 60 * 60 * 1000;

    if (span < 1.5 * day) {
        return date.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    if (span < 3 * day) {
        return date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    if (span > 300 * day) {
        return date.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
        });
    }

    return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
    });
}

function TimeSeriesChart({
    series,
    xMin,
    xMax,
    unit,
    ariaLabel,
    height = 190,
}: Props) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(320);
    const [hoverT, setHoverT] = useState<number | null>(null);

    // Подстраиваем ширину графика под контейнер (боковая панель, профиль и т.д.).
    useEffect(() => {
        const element = wrapRef.current;

        if (!element || typeof ResizeObserver === "undefined") {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const next = Math.floor(entries[0].contentRect.width);

            if (next > 0) {
                setWidth(next);
            }
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const yAxis = useMemo(() => {
        let min = Infinity;
        let max = -Infinity;

        series.forEach((s) =>
            s.points.forEach((p) => {
                if (p.v < min) min = p.v;
                if (p.v > max) max = p.v;
            })
        );

        if (min === max) {
            if (min === 0) {
                max = 1;
            } else {
                const pad = Math.abs(min) * 0.05 || 1;
                min -= pad;
                max += pad;
            }
        }

        const ticks = niceTicks(min, max);
        const labels = ticks.map(formatValue);
        const longest = Math.max(...labels.map((label) => label.length));

        return {
            ticks,
            labels,
            min: ticks[0],
            max: ticks[ticks.length - 1],
            marginLeft: Math.max(34, Math.ceil(longest * 6) + 14),
        };
    }, [series]);

    // Уникальные моменты времени всех точек — для наведения курсора.
    const times = useMemo(() => {
        const set = new Set<number>();
        series.forEach((s) => s.points.forEach((p) => set.add(p.t)));
        return Array.from(set).sort((a, b) => a - b);
    }, [series]);

    const pointsByTime = useMemo(
        () =>
            series.map(
                (s) => new Map(s.points.map((p) => [p.t, p] as const))
            ),
        [series]
    );

    // Если замер один, растягиваем ось X, чтобы точка была по центру.
    const x0 = xMax > xMin ? xMin : xMin - 30 * 60 * 1000;
    const x1 = xMax > xMin ? xMax : xMax + 30 * 60 * 1000;

    const { marginLeft } = yAxis;
    const plotWidth = Math.max(10, width - marginLeft - MARGIN_RIGHT);
    const plotHeight = height - MARGIN_TOP - MARGIN_BOTTOM;

    const xScale = (t: number) =>
        marginLeft + ((t - x0) / (x1 - x0)) * plotWidth;

    const yScale = (v: number) =>
        MARGIN_TOP +
        plotHeight -
        ((v - yAxis.min) / (yAxis.max - yAxis.min)) * plotHeight;

    const xTickCount = Math.max(2, Math.min(5, Math.floor(plotWidth / 85)));
    const xTicks = Array.from({ length: xTickCount }, (_, index) => {
        const ratio = index / (xTickCount - 1);
        return x0 + (x1 - x0) * ratio;
    });

    function handlePointer(event: ReactPointerEvent<SVGSVGElement>) {
        if (times.length === 0) {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;

        let best = times[0];
        let bestDistance = Infinity;

        for (const t of times) {
            const distance = Math.abs(xScale(t) - x);

            if (distance < bestDistance) {
                best = t;
                bestDistance = distance;
            }
        }

        setHoverT(best);
    }

    const hoverRows =
        hoverT === null
            ? []
            : series.flatMap((s, index) => {
                  const point = pointsByTime[index].get(hoverT);
                  return point ? [{ series: s, point }] : [];
              });

    const hoverX = hoverT === null ? 0 : xScale(hoverT);

    return (
        <div className="tsc" ref={wrapRef}>
            <svg
                className="tsc-svg"
                width={width}
                height={height}
                role="img"
                aria-label={ariaLabel}
                onPointerMove={handlePointer}
                onPointerDown={handlePointer}
                onPointerLeave={(event) => {
                    if (event.pointerType === "mouse") {
                        setHoverT(null);
                    }
                }}
            >
                {yAxis.ticks.map((tick, index) => (
                    <g key={tick}>
                        <line
                            className="tsc-grid"
                            x1={marginLeft}
                            x2={width - MARGIN_RIGHT}
                            y1={yScale(tick)}
                            y2={yScale(tick)}
                        />
                        <text
                            className="tsc-tick"
                            x={marginLeft - 6}
                            y={yScale(tick)}
                            textAnchor="end"
                            dominantBaseline="middle"
                        >
                            {yAxis.labels[index]}
                        </text>
                    </g>
                ))}

                {xTicks.map((tick, index) => (
                    <text
                        key={index}
                        className="tsc-tick"
                        x={xScale(tick)}
                        y={height - 6}
                        textAnchor={
                            index === 0
                                ? "start"
                                : index === xTicks.length - 1
                                  ? "end"
                                  : "middle"
                        }
                    >
                        {formatTimeTick(tick, x1 - x0)}
                    </text>
                ))}

                {series.map((s) => (
                    <g key={s.key}>
                        {s.points.length > 1 && (
                            <path
                                d={s.points
                                    .map(
                                        (p, index) =>
                                            `${index === 0 ? "M" : "L"}${xScale(p.t).toFixed(1)} ${yScale(p.v).toFixed(1)}`
                                    )
                                    .join(" ")}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={2}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                        )}

                        {s.points.length <= MARKERS_LIMIT &&
                            s.points.map((p) => (
                                <circle
                                    key={p.t}
                                    cx={xScale(p.t)}
                                    cy={yScale(p.v)}
                                    r={3}
                                    fill={s.color}
                                />
                            ))}
                    </g>
                ))}

                {hoverT !== null && (
                    <g pointerEvents="none">
                        <line
                            className="tsc-guide"
                            x1={hoverX}
                            x2={hoverX}
                            y1={MARGIN_TOP}
                            y2={MARGIN_TOP + plotHeight}
                        />
                        {hoverRows.map(({ series: s, point }) => (
                            <circle
                                key={s.key}
                                cx={hoverX}
                                cy={yScale(point.v)}
                                r={5}
                                fill={s.color}
                                className="tsc-hover-dot"
                            />
                        ))}
                    </g>
                )}
            </svg>

            {hoverT !== null && hoverRows.length > 0 && (
                <div
                    className="tsc-tooltip"
                    style={
                        hoverX > width / 2
                            ? { right: width - hoverX + 10, top: MARGIN_TOP }
                            : { left: hoverX + 10, top: MARGIN_TOP }
                    }
                >
                    <div className="tsc-tooltip-time">
                        {formatDate(new Date(hoverT).toISOString())}
                    </div>

                    {hoverRows.map(({ series: s, point }) => (
                        <div className="tsc-tooltip-row" key={s.key}>
                            <span
                                className="tsc-dot"
                                style={{ background: s.color }}
                            />
                            <span>{s.label}:</span>
                            <strong>
                                {formatValue(point.v)}
                                {unit ? ` ${unit}` : ""}
                            </strong>
                            {point.note && <span>· {point.note}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TimeSeriesChart;

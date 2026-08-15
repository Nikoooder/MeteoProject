export function formatDate(value?: string | null) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function average(values: (number | null | undefined)[]) {
    const numbers = values.filter(
        (value): value is number =>
            typeof value === "number" && !Number.isNaN(value)
    );

    if (numbers.length === 0) {
        return null;
    }

    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

export function formatNumber(value: number | null | undefined, digits = 1) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "—";
    }

    return value.toFixed(digits);
}

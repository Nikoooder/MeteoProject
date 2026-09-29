// Форматирование чисел для диаграмм (ru-локаль): значения от 1 — до 2 знаков
// после запятой (1 009,9; 15,72), малые значения — 3 значащие цифры (0,0312).
export function formatValue(value: number) {
    if (Math.abs(value) >= 1 || value === 0) {
        return value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
    }

    return value.toLocaleString("ru-RU", { maximumSignificantDigits: 3 });
}

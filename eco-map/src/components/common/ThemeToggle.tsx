import { useTheme } from "../../api/ThemeContext";
import "./ThemeToggle.css";

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={
                theme === "dark"
                    ? "Переключить на светлую тему"
                    : "Переключить на тёмную тему"
            }
            title={
                theme === "dark"
                    ? "Светлая тема"
                    : "Тёмная тема"
            }
        >
            {theme === "dark" ? "☀️" : "🌙"}
        </button>
    );
}

export default ThemeToggle;

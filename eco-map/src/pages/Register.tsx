import { useState, useRef } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";
import "./AuthForm.css";

function Register() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const specularRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (password !== confirmPassword) {
            setError("Пароли не совпадают");
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        try {
            const response = await api.post("/auth/register", {
                username: username.trim(),
                email: normalizedEmail,
                password
            });

            setMessage(response.data.message || "Регистрация успешна");

            setTimeout(() => {
                navigate("/login");
            }, 1000);
        } catch (err: unknown) {
            console.error(err);

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Ошибка регистрации");
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || !specularRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        specularRef.current.style.background = `radial-gradient(
            circle at ${x}px ${y}px,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.05) 30%,
            rgba(255, 255, 255, 0) 60%
        )`;
    };

    const handleMouseLeave = () => {
        if (specularRef.current) {
            specularRef.current.style.background = "none";
        }
    };

    return (
        <div className="register-page">
            {/* SVG-фильтр для искажения стекла */}
            <svg style={{ display: "none" }}>
                <filter id="glass-distortion">
                    <feTurbulence
                        type="turbulence"
                        baseFrequency={0.008}
                        numOctaves={2}
                        result="noise"
                    />

                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale={77}
                    />
                </filter>
            </svg>

            <div
                className="register-card"
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div className="glass-filter"></div>
                <div className="glass-overlay"></div>
                <div
                    className="glass-specular"
                    ref={specularRef}
                ></div>

                <div className="glass-content">
                    <h2 className="register-title">
                        Регистрация
                    </h2>

                    <form
                        className="register-form"
                        onSubmit={handleRegister}
                    >
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Имя пользователя"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setError("");
                                }}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError("");
                                }}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError("");
                                }}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Повторите пароль"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setError("");
                                }}
                                required
                            />
                        </div>

                        <button
                            className="register-button"
                            type="submit"
                        >
                            Зарегистрироваться
                        </button>
                    </form>

                    {message && (
                        <p className="register-message">
                            {message}
                        </p>
                    )}

                    {error && (
                        <p className="register-error">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Register;
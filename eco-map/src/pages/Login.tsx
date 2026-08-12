
import { useState, useRef } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import { Link } from "react-router-dom";
import "./AuthForm.css";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const specularRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError("");
            setMessage("");

            const response = await api.post("/auth/login", {
                email,
                password
            });

            login(
                response.data.user,
                response.data.token
            );

            setMessage("Вход успешен");

            setTimeout(() => {
                navigate("/home");
            }, 1000);

        } catch (err: unknown) {
            console.error(err);

            if (
                typeof err === "object" &&
                err !== null &&
                "response" in err &&
                (
                    err as {
                        response?: {
                            status?: number
                        }
                    }
                ).response?.status === 401
            ) {
                setError("Неверная почта или пароль");
            } else {
                setError("Ошибка входа");
            }
        }
    };

    const handleMouseMove = (
        e: React.MouseEvent<HTMLDivElement>
    ) => {
        if (!cardRef.current || !specularRef.current) {
            return;
        }

        const rect =
            cardRef.current.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        specularRef.current.style.background =
            `radial - gradient(
    circle at ${ x }px ${ y }px,
    rgba(255, 255, 255, 0.15) 0 %,
    rgba(255, 255, 255, 0.05) 30 %,
    rgba(255, 255, 255, 0) 60 %
            )`;
    };

    const handleMouseLeave = () => {
        if (specularRef.current) {
            specularRef.current.style.background = "none";
        }
    };

    return (
        <div className="register-page">

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
                        Вход
                    </h2>

                    <form
                        className="register-form"
                        onSubmit={handleLogin}
                    >

                        <div className="form-group">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                            />
                        </div>

                        <button
                            className="register-button"
                            type="submit"
                        >
                            Войти
                        </button>

                        <p className="register-link">
                            Нет профиля? <Link to="/register">Зарегистрироваться</Link>
                        </p>

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

export default Login;


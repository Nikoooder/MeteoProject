import axios from "axios";

// В обычной разработке фронтенд и бэкенд оба на localhost.
// Для теста с телефона (или другого устройства в локальной сети) задайте
// в eco-map/.env.local переменную:
//   VITE_API_URL=http://<IP-вашего-компьютера-в-сети>:8080/api
const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

export const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});
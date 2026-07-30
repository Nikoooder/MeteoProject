import axios from "axios";

export const api = axios.create({
    baseURL: "https://localhost:7181",
    headers: {
        "Content-Type": "application/json"
    }
});
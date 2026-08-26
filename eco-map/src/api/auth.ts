import { api } from "./api";

export async function register(
    username: string,
    email: string,
    password: string
) {
    return api.post("/auth/register", {
        username,
        email,
        password
    });
}


export async function login(
    email: string,
    password: string
) {
    const response = await api.post("/auth/login", {
        email,
        password
    });

    sessionStorage.setItem(
        "token",
        response.data.token
    );

    sessionStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
    );

    return response.data;
}
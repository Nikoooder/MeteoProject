import {
    createContext,
    useContext,
    useState
} from "react";

interface User {
    id: number;
    username: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    login: (user: User, token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { }
});

export function AuthProvider({
    children
}: {
    children: React.ReactNode
}) {

    const [user, setUser] = useState<User | null>(() => {
        // Сессионное хранилище: токен «одноразовый» — он живёт, пока открыта
        // вкладка/браузер, и удаляется, когда пользователь закрывает сайт.
        // При следующем заходе понадобится повторный вход.
        const savedUser = sessionStorage.getItem("user");

        return savedUser
            ? JSON.parse(savedUser)
            : null;
    });


    function login(user: User, token: string) {
        sessionStorage.setItem(
            "token",
            token
        );

        sessionStorage.setItem(
            "user",
            JSON.stringify(user)
        );

        setUser(user);
    }


    function logout() {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        setUser(null);
    }


    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
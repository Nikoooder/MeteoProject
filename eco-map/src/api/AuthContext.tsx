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
    logout: () => void;
}


const AuthContext = createContext<AuthContextType>({
    user: null,
    logout: () => { }
});


export function AuthProvider({
    children
}: {
    children: React.ReactNode
}) {

    const [user, setUser] = useState<User | null>(() => {

        const savedUser =
            localStorage.getItem("user");

        return savedUser
            ? JSON.parse(savedUser)
            : null;
    });


    function logout() {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
    }


    return (
        <AuthContext.Provider
            value={{
                user,
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
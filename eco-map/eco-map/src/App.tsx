import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

function RequireAuth({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

function App() {

    const token = localStorage.getItem("token");

    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/"
                    element={
                        token
                            ? <Home />
                            : <Register />
                    }
                />

                <Route path="/login" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route path="/home" element={<Home />} />

                <Route
                    path="/profile"
                    element={
                        <RequireAuth>
                            <Profile />
                        </RequireAuth>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;

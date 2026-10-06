import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-loading">
                <p>Loading InterviewTree...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
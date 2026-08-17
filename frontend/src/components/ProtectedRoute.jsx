import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAppData } from "../context/AppContext"

const ProtectedRoute = () => {

    const { isAuth, user, loading } = useAppData()
    const location = useLocation()

    if (loading) return null

    if (!isAuth) {
        return <Navigate to="/login" replace />
    }

    if (!user) return null

    // Treat any falsy role as "not chosen yet", matching Login.jsx and Home.jsx.
    // Checking === null here instead would bounce a user whose role is undefined
    // straight back to "/", which then sends them here again — a redirect loop.
    const hasRole = Boolean(user.role)

    if (!hasRole && location.pathname !== "/select-role") {
        return <Navigate to="/select-role" replace />
    }

    if (hasRole && location.pathname === "/select-role") {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}

export default ProtectedRoute
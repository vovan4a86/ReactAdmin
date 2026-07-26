import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const GuestRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return null;
    }

    if (isAuthenticated) {
        return <Navigate to="/profile" replace />;
    }

    return children;
};

export default GuestRoute;
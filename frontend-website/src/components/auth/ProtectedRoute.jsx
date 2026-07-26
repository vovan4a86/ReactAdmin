import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';

export function ProtectedRoute({ children, adminOnly = false }) {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const location = useLocation();

    // Показываем загрузку пока проверяем токен
    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    gap: 2,
                }}
            >
                <CircularProgress size={48} />
                <Typography variant="body2" color="text.secondary">
                   Проверяем аутентификацию...
                </Typography>
            </Box>
        );
    }

    // Не авторизован - на логин
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Требуются права админа, но их нет
    if (adminOnly && !isAdmin) {
        return <Navigate to="/profile" replace />;
    }

    return children;
}

export default ProtectedRoute;
import { Navigate } from 'react-router-dom';
import { useUserState } from '../context/UserContext'; // или ваш хук

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, currentUser } = useUserState();

    console.log('🔒 ProtectedRoute:', { isAuthenticated, currentUser });

    // Если не авторизован - перенаправляем на логин
    if (!isAuthenticated || !currentUser) {
        console.log('⛔ Не авторизован, перенаправление на /login');
        return <Navigate to="/login" replace />;
    }

    // Если авторизован - показываем страницу
    console.log('✅ Авторизован, показываем страницу');
    return children;
};

export default ProtectedRoute;
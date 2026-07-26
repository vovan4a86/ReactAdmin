/**
 * AuthContext.jsx
 *
 * НАЗНАЧЕНИЕ:
 * Централизованное хранилище данных аутентификации пользователя.
 *
 * ПРОБЛЕМА, КОТОРУЮ РЕШАЕМ:
 * Без контекста нам пришлось бы передавать пропсы (user, token, login, logout)
 * через каждый компонент в цепочке: App -> Layout -> Header -> UserMenu
 * Это называется "prop drilling" — сверление пропсами.
 *
 * КОНЦЕПЦИЯ:
 * Представьте, что AuthContext — это глобальная радиовышка.
 * AuthProvider — это радиостанция, которая вещает сигнал.
 * useAuthContext() — это радиоприёмник в любом компоненте.
 *
 * ПРИМЕР ИСПОЛЬЗОВАНИЯ В КОМПОНЕНТЕ:
 * const { user, logout } = useAuthContext();
 * <button onClick={logout}>Выйти из {user.name}</button>
 */
import {createContext, useContext, useState, useCallback, useEffect} from 'react';
import {websiteAPI} from '../services/api';

// ============================================================
// ШАГ 1: СОЗДАЁМ ХРАНИЛИЩЕ
// ============================================================
// createContext() создаёт "пустой склад" для данных.
// undefined означает "склад пустой, ничего не положили".
// Это как объявить переменную, но не присвоить ей значение.
const AuthContext = createContext(null);

// ============================================================
// ШАГ 2: СОЗДАЁМ ПОСТАВЩИКА (Provider)
// ============================================================
// AuthProvider — это компонент-обёртка.
// Он будет оборачивать всё наше приложение в main.jsx.
//
// ЗАДАЧИ AuthProvider:
// 1. Хранить состояние пользователя (user, token)
// 2. Предоставлять методы для входа/выхода (login, logout)
// 3. Сохранять токен в localStorage (чтобы не разлогинивало при перезагрузке)
export function AuthProvider({children}) {
    // ----------------------------------------------------------
    // СОСТОЯНИЯ (State)
    // ----------------------------------------------------------

    // user — объект с данными вошедшего пользователя
    // null = "никто не вошёл"
    // { id: 1, name: "Иван", email: "ivan@mail.ru" } = "пользователь вошёл"
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Инициализация - проверяем токен при загрузке
    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem('auth_token');

            if (!savedToken) {
                setLoading(false);
                return;
            }

            try {
                // Проверяем валидность токена, запрашивая данные пользователя
                const response = await websiteAPI.getMe('/auth/me');
                setUser(response.data.user);
                setToken(savedToken);
            } catch (err) {
                // Токен невалидный - очищаем
                console.error('Auth initialization failed:', err);
                localStorage.removeItem('auth-token');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        initAuth();
    }, []); // Только при монтировании

    // ----------------------------------------------------------
    // МЕТОДЫ (Actions)
    // ----------------------------------------------------------

    /**
     * login — войти в систему
     *
     * ПОЧЕМУ useCallback?
     * Эта функция передаётся в контекст и будет использоваться
     * в useEffect других компонентов как зависимость.
     * useCallback гарантирует, что ссылка на функцию не меняется
     * при каждом рендере (если не изменились зависимости).
     *
     * ПОЧЕМУ async?
     * Запрос к серверу — асинхронная операция.
     * Мы не знаем, когда сервер ответит: 10 мс или 3 секунды.
     */
    const login = useCallback(async (email, password) => {
        setError(null);

        try {
            const { data } = await websiteAPI.login(email, password);
            // const { status } = await websiteAPI.test();
            // console.log(status);
            const { token: newToken, user: userData } = data;

            // Обновляем состояние — React перерендерит все компоненты,
            // которые используют этот контекст
            localStorage.setItem('auth_token', newToken);
            setToken(newToken);
            setUser(userData);

            return { success: true, user: userData };
        } catch (err) {
            const message = err.response?.data?.message || 'Ошибка входа';
            const errors = err.response?.data?.errors || {};

            setError(message);

            return {
                success: false,
                message,
                errors
            };
        }

    }, []) // useCallback без зависимостей, так как использует setState (стабильные ссылки)

    // Register
    const register = useCallback(async ({ name, email, password, password_confirmation }) => {
        setError(null);

        try {
            const { data } = await websiteAPI.register({
                name,
                email,
                password,
                password_confirmation,
            });

            const { token: newToken, user: userData } = data;

            localStorage.setItem('auth-token', newToken);
            setToken(newToken);
            setUser(userData);

            return { success: true, user: userData };
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            const errors = err.response?.data?.errors || {};

            setError(message);

            return {
                success: false,
                message,
                errors
            };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // Пытаемся вызвать API logout
            await websiteAPI.logout();
        } catch (err) {
            console.error('Logout API error:', err)
        } finally {
            // Всегда очищаем локальные данные
            localStorage.removeItem('auth-token');
            setToken(null);
            setUser(null);
            setError(null);
        }
    }, [])

    // Обновление данных пользователя
    const updateUser = useCallback((userData) => {
        setUser(prev => prev ? { ...prev, ...userData } : userData);
    }, []);

    // ----------------------------------------------------------
    // ФОРМИРУЕМ ОБЪЕКТ ДЛЯ ПЕРЕДАЧИ В КОНТЕКСТ
    // ----------------------------------------------------------
    // value — это то, что получат все компоненты через useAuthContext()
    //
    // isAuthenticated — удобное вычисляемое свойство
    // !!token — двойное отрицание превращает любое значение в boolean:
    //   "abc" -> true
    //   null  -> false
    const value = {
        user,              // данные пользователя
        token,             // JWT-токен для API-запросов
        loading,
        error,
        isAuthenticated: !!token && !!user,  // true/false — вошёл или нет
        isAdmin: user?.role === 'admin' || user?.is_admin === true,
        login,             // функция входа
        logout,            // функция выхода
        register,
        updateUser,
        setError
    }

    // ----------------------------------------------------------
    // РЕНДЕРИМ ПРОВАЙДЕР
    // ----------------------------------------------------------
    // AuthContext.Provider — специальный компонент React.
    // Всё, что внутри него (children), будет иметь доступ к value.
    //
    // В main.jsx это выглядит так:
    // <AuthProvider>
    //   <App />  <-- App и все его потомки видят контекст
    // </AuthProvider>
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

// ============================================================
// ШАГ 3: СОЗДАЁМ ХУК ДЛЯ УДОБНОГО ДОСТУПА
// ============================================================
/**
 * useAuthContext — кастомный хук
 *
 * ЗАЧЕМ НУЖЕН ОТДЕЛЬНЫЙ ХУК?
 * 1. Удобство: вместо useContext(AuthContext) пишем useAuthContext()
 * 2. Безопасность: проверяем, что хук используется внутри AuthProvider
 *    Если разработчик забыл обернуть приложение в <AuthProvider>,
 *    он получит понятную ошибку вместо загадочного "undefined is not..."
 *
 * ПРИМЕР ОШИБКИ:
 * Если написать const { user } = useAuthContext() в компоненте,
 * который НЕ находится внутри <AuthProvider>,
 * то вылетит ошибка с текстом ниже.
 * Это спасает от часов отладки.
 */

export function useAuthContext() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuthContext must be used within AuthProvider')
    return context
}

/**
 * main.jsx
 * ├── <AuthProvider>           ← здесь хранятся user, token
 * │   ├── <App>
 * │   │   ├── <Header>        ← useAuthContext() → { user, logout }
 * │   │   │   └── кнопка "Выйти"
 * │   │   ├── <Routes>
 * │   │   │   ├── <Home>      ← useAuthContext() → { isAuthenticated }
 * │   │   │   │   └── показывает разный контент гостю/юзеру
 * │   │   │   └── <Profile>   ← useAuthContext() → { user }
 * │   │   │       └── показывает имя пользователя
 */

/**
 * Что происходит при логине (по шагам):
 * 1. Пользователь вводит email/password в форму
 * 2. Форма вызывает login(email, password)
 * 3. login отправляет fetch POST /api/login
 * 4. Сервер Laravel проверяет данные, возвращает { token, user }
 * 5. setToken(data.token) → React сохраняет токен в памяти
 * 6. setUser(data.user)   → React сохраняет юзера в памяти
 * 7. localStorage.setItem → токен сохраняется в браузере
 * 8. React видит, что состояние изменилось
 * 9. React перерендеривает ВСЕ компоненты, которые используют useAuthContext()
 * 10. Header видит user.name и показывает "Привет, Иван"
 * 11. Кнопка "Войти" исчезает, появляется кнопка "Выйти"
 */

/**
 * Что происходит при перезагрузке страницы
 * 1. Браузер перезагружает страницу
 * 2. React монтирует всё приложение заново
 * 3. AuthProvider создаётся заново
 * 4. useState(() => localStorage.getItem('auth-token'))
 *    читает токен из localStorage браузера
 * 5. token !== null → isAuthenticated = true
 * 6. Пользователь ВСЁ ЕЩЁ считается залогиненым
 * 7. Компоненты показывают защищённый контент
 * 8. Header может сделать запрос GET /api/user с этим токеном,
 *    чтобы восстановить данные пользователя
 */
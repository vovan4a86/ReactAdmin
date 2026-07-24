/**
 * client.js — HTTP-клиент для взаимодействия с Laravel API
 *
 * НАЗНАЧЕНИЕ:
 * Единая точка отправки всех API-запросов в приложении.
 *
 * ПРОБЛЕМА, КОТОРУЮ РЕШАЕМ:
 * Представьте, что у вас 50 компонентов, и каждый делает fetch напрямую.
 * Внезапно нужно:
 * - Добавить токен авторизации ко всем запросам → править 50 файлов
 * - Сменить базовый URL с localhost на продакшен → править 50 файлов
 * - Добавить обработку 401 (токен истёк) → править 50 файлов
 * - Логировать ошибки → править 50 файлов
 *
 * С клиентом: меняем ОДИН файл — и всё приложение работает по-новому.
 * Это паттерн "Single Responsibility" — класс отвечает только за HTTP-запросы.
 */

// Где мы используем apiClient?
// Везде, кроме AuthContext! Вот как это должно выглядеть:
/**
 *
 * Users.jsx
 *
 * import { apiClient } from '../api/client'
 * function Users() {
 *   const [users, setUsers] = useState([])
 *
 *   useEffect(() => {
 *     // ✅ ПРАВИЛЬНО: используем apiClient для защищённых запросов
 *     apiClient.get('/users')
 *       .then(setUsers)
 *       .catch(error => console.error(error))
 *   }, [])
 * }
 *
 * Posts.jsx
 *
 * import { apiClient } from '../api/client'
 *
 * function Posts() {
 *   const createPost = async (data) => {
 *     // ✅ ПРАВИЛЬНО: клиент сам добавит токен и Content-Type
 *     const post = await apiClient.post('/posts', data)
 *   }
 * }
 */

//Почему в AuthContext мы не используем apiClient?
//Причина 1: Циклическая зависимость (главная!)
//Причина 2: Логин — это особый случай
//Если бы логин шёл через apiClient, клиент попытался бы добавить токен (которого ещё нет) в заголовок.
//Причина 3: Разная обработка ответа
//apiClient при 401 делает window.location.href = '/login' — это убьёт всё состояние React,
// включая сам процесс логина. А мы просто хотим показать "Неверный пароль".

/**
 *
 * ┌─────────────────────────────────────────────────────┐
 * │          Схема: кто что использует                  │
 * ├─────────────────────────────────────────────────────┤
 * │                                                     │
 * │  AuthContext.jsx (логин/логаут)                     │
 * │  ├── fetch('/api/auth/login')    ← ПРЯМОЙ fetch     │
 * │  └── fetch('/api/auth/register') ← ПРЯМОЙ fetch     │
 * │                                                     │
 * │  ВСЕ ОСТАЛЬНЫЕ КОМПОНЕНТЫ:                          │
 * │  ├── Users.jsx                                      │
 * │  │   └── apiClient.get('/users')    ← ЧЕРЕЗ КЛИЕНТ  │
 * │  ├── Posts.jsx                                      │
 * │  │   └── apiClient.post('/posts')   ← ЧЕРЕЗ КЛИЕНТ  │
 * │  ├── Profile.jsx                                    │
 * │  │   └── apiClient.put('/profile')   ← ЧЕРЕЗ КЛИЕНТ │
 * │  └── Dashboard.jsx                                  │
 * │      └── apiClient.get('/stats')     ← ЧЕРЕЗ КЛИЕНТ │
 * │                                                     │
 * └─────────────────────────────────────────────────────┘
 * Мнемоническое правило:
  * AuthContext — единственное место, где мы НЕ используем apiClient, потому что он управляет токенами, а не потребляет их
  * Везде ещё — используем apiClient, потому что нам нужен готовый токен в заголовках
 */

// Берём URL из переменных окружения (.env.local)
// import.meta.env — это как $_ENV в Laravel, только для Vite
// VITE_ префикс ОБЯЗАТЕЛЕН — Vite так фильтрует переменные для фронтенда
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

class ApiClient {
    /**
     * Конструктор
     * @param {string} baseUrl — корневой URL API (например, https://api.mysite.com)
     *
     * ПОЧЕМУ ПАРАМЕТР, А НЕ КОНСТАНТА?
     * Позволяет создать несколько клиентов для разных API:
     * const mainApi = new ApiClient('https://api.mysite.com')
     * const cdnApi  = new ApiClient('https://cdn.mysite.com')
     */
    constructor(baseUrl) {
        this.baseUrl = baseUrl
    }

    /**
     * getToken — получить токен из localStorage
     *
     * ПОЧЕМУ МЕТОД, А НЕ НАПРЯМУЮ В КОДЕ?
     * 1. Можно переопределить в наследнике (например, брать из cookies)
     * 2. Можно добавить логику проверки срока жизни токена
     * 3. Единое место для изменения стратегии хранения
     *
     * СЕЙЧАС ЭТО ПРОСТО, НО ЗАДЕЛ НА БУДУЩЕЕ:
     * Завтра вы решите хранить токен в httpOnly cookie вместо localStorage.
     * Поменяете только этот метод — и весь код работает.
     */
    getToken() {
        return localStorage.getItem('auth-token')
    }

    /**
     * request — ЯДРО КЛИЕНТА, основной метод для запросов
     *
     * @param {string} endpoint — путь после baseUrl, например '/users' или '/posts/5'
     * @param {object} options — настройки запроса (method, body, headers и наши кастомные)
     * @param {boolean} options.requiresAuth — нужно ли добавлять токен (по умолчанию true)
     *
     * ПОЧЕМУ ДЕСТРУКТУРИЗАЦИЯ?
     * const { requiresAuth = true, ...fetchOptions } = options
     *
     * options = {
     *   method: 'POST',
     *   body: '{"name":"Иван"}',
     *   requiresAuth: false  ← это наш кастомный параметр, его fetch не поймёт
     * }
     *
     * После деструктуризации:
     *   requiresAuth = false
     *   fetchOptions = { method: 'POST', body: '{"name":"Иван"}' }  ← только то, что понимает fetch
     *
     * ПАРАМЕТР requiresAuth:
     *   true (по умолчанию) — добавляем Bearer токен (для защищённых эндпоинтов)
     *   false — не добавляем (для /login, /register, публичных страниц)
     */
    async request(endpoint, options = {}) {
        const { requiresAuth = true, ...fetchOptions } = options

        /**
         * ФОРМИРУЕМ ЗАГОЛОВКИ
         *
         * Content-Type: application/json — говорим Laravel, что шлём JSON
         * Accept: application/json — говорим Laravel, что ждём JSON в ответ
         *   Это важно! Без Accept: application/json Laravel может вернуть HTML
         *   при ошибке валидации вместо JSON с перечнем полей.
         */
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...fetchOptions.headers,  // пользовательские заголовки перезаписывают дефолтные
        }

        /**
         * ДОБАВЛЯЕМ ТОКЕН АВТОРИЗАЦИИ
         *
         * Схема Bearer — это стандарт OAuth 2.0 / JWT
         * Laravel Sanctum/Passeport ожидают именно такой формат:
         * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
         *
         * ПОЧЕМУ ПРОВЕРКА ПО ТОКЕНУ, А НЕ ПО isAuthenticated?
         * isAuthenticated — это удобство для UI (показать/скрыть кнопку)
         * token — это реальные данные для сервера
         * Они могут рассинхронизироваться: токен ещё в localStorage, но уже истёк
         */
        if (requiresAuth) {
            const token = this.getToken()
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }
            // Если токена нет — не добавляем заголовок.
            // Сервер сам решит, пускать без авторизации или вернуть 401.
            // Это лучше, чем слать "Bearer null" или "Bearer undefined".
        }

        /**
         * ВЫПОЛНЯЕМ ЗАПРОС
         *
         * fetch принимает:
         * 1. URL = baseUrl + endpoint
         *    '/api' + '/users' = '/api/users'
         *    '/api/' + '/users' = '/api//users' ← двойной слеш! Поэтому в API_BASE_URL нет слеша в конце
         * 2. Объект настроек с заголовками
         */
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...fetchOptions,
            headers,
        })

        /**
         * ОБРАБОТКА ОШИБОК
         *
         * fetch НЕ выбрасывает исключение при 4xx и 5xx статусах.
         * fetch считает ошибкой только сетевые проблемы (нет интернета, DNS не найден).
         * Поэтому мы ДОЛЖНЫ явно проверять response.ok.
         *
         * response.ok = true при статусах 200-299
         * response.ok = false при 300-599
         *
         * ОСОБАЯ ОБРАБОТКА 401 (Unauthorized):
         * 401 означает, что токен истёк или невалиден.
         * Мы не можем автоматически обновить токен (это сложная логика refresh token),
         * но можем:
         * 1. Удалить невалидный токен из localStorage
         * 2. Перенаправить на страницу логина
         *
         * ПОЧЕМУ window.location.href, А НЕ navigate() из React Router?
         * Мы внутри класса, не компонента React — у нас нет доступа к хукам.
         * window.location.href — это "жёсткое" перенаправление,
         * которое перезагрузит страницу и сбросит всё состояние React.
         * Это приемлемо для логаута — мы ХОТИМ сбросить состояние.
         */
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('auth-token')
                window.location.href = '/login'
            }

            /**
             * ВАЖНО: Здесь мы выбрасываем ошибку, а не обрабатываем молча.
             * Компоненты, которые вызывают API, должны обернуть вызов в try/catch
             * и показать пользователю сообщение об ошибке.
             *
             * Пример в компоненте:
             * try {
             *   await apiClient.post('/posts', data)
             * } catch (error) {
             *   setError(error.message)  // показываем красное уведомление
             * }
             */
            throw new Error(`API Error: ${response.statusText}`)
        }

        /**
         * ВОЗВРАЩАЕМ JSON
         *
         * response.json() — асинхронный метод, парсит тело ответа как JSON.
         * Возвращает ПРОМИС, поэтому мы его await'им.
         *
         * ПОЧЕМУ НЕ ПРОВЕРЯЕМ, ЧТО ОТВЕТ ДЕЙСТВИТЕЛЬНО JSON?
         * Мы указали Accept: application/json в заголовках.
         * Если сервер настроен правильно (Laravel так и делает), он вернёт JSON.
         */
        return response.json()
    }

    /**
     * МЕТОДЫ-СОКРАЩЕНИЯ (syntactic sugar — синтаксический сахар)
     *
     * Вместо:
     *   apiClient.request('/users', { method: 'GET' })
     * Пишем:
     *   apiClient.get('/users')
     *
     * Это просто удобство. Каждый метод делегирует вызов request().
     */

    // GET — получить данные
    // apiClient.get('/users') → GET /api/users
    get(endpoint, options) {
        return this.request(endpoint, { ...options, method: 'GET' })
    }

    // POST — создать новые данные
    // apiClient.post('/users', { name: 'Иван' }) → POST /api/users с телом JSON
    // Принимает data ВТОРЫМ параметром — это интуитивно понятно
    post(endpoint, data, options) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),  // превращаем объект в JSON-строку
        })
    }

    // PUT — обновить существующие данные (полностью)
    // apiClient.put('/users/5', { name: 'Пётр' }) → PUT /api/users/5
    put(endpoint, data, options) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    // DELETE — удалить данные
    // apiClient.delete('/users/5') → DELETE /api/users/5
    delete(endpoint, options) {
        return this.request(endpoint, { ...options, method: 'DELETE' })
    }
}

/**
 * ЭКСПОРТИРУЕМ ОДИН ЭКЗЕМПЛЯР (singleton)
 *
 * ПОЧЕМУ ЭКЗЕМПЛЯР, А НЕ КЛАСС?
 * Нам не нужно создавать новый ApiClient в каждом файле.
 * Один экземпляр — один baseUrl — все запросы идут через него.
 *
 * ИМПОРТ В КОМПОНЕНТАХ:
 * import { apiClient } from '../api/client'
 *
 * И ВСЁ! Не надо писать new ApiClient().
 */
export const apiClient = new ApiClient(API_BASE_URL)
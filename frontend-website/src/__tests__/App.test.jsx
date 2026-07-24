import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

vi.mock('../contexts/ThemeContext', () => ({
    ThemeContextProvider: ({ children }) => children,
    useThemeContext: () => ({
        theme: {},
        mode: 'light',
        toggleTheme: vi.fn(),
    }),
}))

vi.mock('../contexts/AuthContext', () => ({
    AuthProvider: ({ children }) => children,
    useAuthContext: () => ({
        user: null,
        token: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
    }),
}))

vi.mock('../contexts/LayoutContext', () => ({
    LayoutProvider: ({ children }) => children,
    useLayoutContext: () => ({
        isMenuOpen: false,
        toggleMenu: vi.fn(),
        closeMenu: vi.fn(),
    }),
}))

describe('App', () => {
    it('renders home page', () => {
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        )

        expect(screen.getByText(/Welcome to My Website/i)).toBeInTheDocument()
    })
})
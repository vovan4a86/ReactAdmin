import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { createTheme } from '@mui/material/styles'
import { themeConfig } from '../theme'

const ThemeContext = createContext(undefined)

export function ThemeContextProvider({ children }) {
    const [mode, setMode] = useState(() => {
        const saved = localStorage.getItem('theme-mode')
        return (saved === 'dark' || saved === 'light') ? saved : 'light'
    })

    const theme = useMemo(() => createTheme(themeConfig(mode)), [mode])

    const toggleTheme = useCallback(() => {
        setMode(prevMode => {
            const newMode = prevMode === 'light' ? 'dark' : 'light'
            localStorage.setItem('theme-mode', newMode)
            return newMode
        })
    }, [])

    return (
        <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useThemeContext() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error('useThemeContext must be used within ThemeContextProvider')
    return context
}
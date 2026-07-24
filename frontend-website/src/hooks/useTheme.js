import { useThemeContext } from '../contexts/ThemeContext'

export function useTheme() {
    const { mode, toggleTheme } = useThemeContext()
    return { mode, toggleTheme }
}
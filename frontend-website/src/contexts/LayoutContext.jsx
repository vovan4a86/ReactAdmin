import { createContext, useContext, useState } from 'react'

const LayoutContext = createContext(null)

export function LayoutProvider({ children}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => setIsMenuOpen(prev => !prev)
    const closeMenu = () => setIsMenuOpen(false)

    return (
        <LayoutContext.Provider value={{ isMenuOpen, toggleMenu, closeMenu }}>
            { children }
        </LayoutContext.Provider>
    )
}

export function useLayoutContext() {
    const context = useContext(LayoutContext)
    if (!context) throw new Error('useLayoutContext must be used within LayoutProvider')
    return context
}
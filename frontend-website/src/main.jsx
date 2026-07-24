import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from "react-router-dom";
import { ThemeContextProvider } from './contexts/ThemeContext';
import { AuthProvider as AuthContextProvider } from './contexts/AuthContext';
import { LayoutProvider as LayoutContextProvider } from './contexts/LayoutContext';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <ThemeContextProvider>
                <AuthContextProvider>
                    <LayoutContextProvider>
                        <App/>
                    </LayoutContextProvider>
                </AuthContextProvider>
            </ThemeContextProvider>
        </BrowserRouter>
    </StrictMode>,
)

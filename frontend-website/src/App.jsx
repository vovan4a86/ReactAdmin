import {BrowserRouter, Routes, Route} from 'react-router-dom'
import './App.css'
import {useThemeContext} from './contexts/ThemeContext'
import {CssBaseline, ThemeProvider} from "@mui/material";
import {AuthProvider} from "./contexts/AuthContext.jsx";
import GuestRoute from "./components/auth/GuestRoute.jsx"
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx"
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Login from "./pages/auth/Login.jsx";
import Profile from "./pages/Profile.jsx";

function App() {
    const {theme} = useThemeContext();

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <AuthProvider>
                {/*<BrowserRouter>*/}
                    <Layout>
                        <Routes>
                            {/* Public Routes */}
                            <Route
                                path="/"
                                element={
                                    <GuestRoute>
                                        <Home />
                                    </GuestRoute>
                                }
                            />

                            <Route
                                path="/login"
                                element={
                                    <GuestRoute>
                                        <Login />
                                    </GuestRoute>
                                }
                            />

                            {/* Protected Routes */}
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Default redirect */}
                            <Route path="/" element={<Home/>}></Route>
                            <Route path="*" element={<NotFound/>}></Route>
                        </Routes>
                    </Layout>
                {/*</BrowserRouter>*/}
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App

import { Link as RouterLink } from 'react-router-dom'
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Box,
} from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { useThemeContext } from '../../contexts/ThemeContext'
import { useAuthContext } from '../../contexts/AuthContext'

function Header() {
    const { mode, toggleTheme } = useThemeContext()
    const { isAuthenticated, user, logout } = useAuthContext()

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography
                    variant="h6"
                    component={RouterLink}
                    to="/"
                    sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
                >
                    Сайт на React 19
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton color="inherit" onClick={toggleTheme}>
                        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    {isAuthenticated ? (
                        <>
                            <Typography variant="body2">{user?.name}</Typography>
                            <Button color="inherit" onClick={logout}>
                                Выйти
                            </Button>
                        </>
                    ) : (
                        <Button color="inherit" component={RouterLink} to="/login">
                            Войти
                        </Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    )
}

export default Header
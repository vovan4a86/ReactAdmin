import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
    Box,
    Button,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    InputAdornment,
    IconButton,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, error, setError } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const from = location.state?.from || '/profile';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        // Очищаем ошибки полей при изменении
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: ''}))
        }
        if (error) setError(null);
    }

    const validateForm = () => {
        const errors = {};

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Неправильный формат email';
        }

        if (!formData.password) {
            errors.password = 'Пароль обязателен';
        } else if (formData.password.length < 6) {
            errors.password = 'Пароль должен быть не меньше 6 знаков';
        }

        return errors;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);

        const result = await login(formData);

        setLoading(false);

        if (result.success) {
            // Редирект на страницу, с которой пришли
            navigate(from, { replace: true})
        } else {
            // Устанавливаем ошибки от сервера
            if (result.errors) {
                setFieldErrors(result.errors);
                console.error(result.errors);
            }
        }
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 2,
            }}
        >
            <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 2 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
                        Добро пожаловать
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
                        Войдите в свой аккаунт
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={!!fieldErrors.email}
                            helperText={fieldErrors.email}
                            margin="normal"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email />
                                    </InputAdornment>
                                ),
                            }}
                            autoFocus
                            autoComplete="email"
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            error={!!fieldErrors.password}
                            helperText={fieldErrors.password}
                            margin="normal"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            autoComplete="current-password"
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="remember_me"
                                        checked={formData.remember_me}
                                        onChange={handleChange}
                                        color="primary"
                                        size="small"
                                    />
                                }
                                label="Remember me"
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    )
}
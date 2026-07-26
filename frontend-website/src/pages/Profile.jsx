import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { websiteAPI } from '../services/api';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Grid,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tab,
    Tabs,
    TextField,
    Alert,
    CircularProgress,
    Paper,
} from '@mui/material';
import {
    Person,
    Edit,
    Lock,
    History,
    Logout,
    Dashboard,
} from '@mui/icons-material';

const Account = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });
    const [passwords, setPasswords] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await websiteAPI.updateProfile(profile);
            setMessage({ type: 'success', text: 'Профиль успешно обновлен!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Не удалось обновить' });
        }
        setLoading(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await websiteAPI.updatePassword(passwords);
            setMessage({ type: 'success', text: 'Пароль успешно обновлен!' });
            setPasswords({ current_password: '', password: '', password_confirmation: '' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Ошибка обновления пароля' });
        }
        setLoading(false);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Мой профиль
            </Typography>

            {/* Profile Header */}
            <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Avatar sx={{ width: 80, height: 80, fontSize: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box>
                        <Typography variant="h5">{user?.name}</Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            {user?.email}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                            Дата регистрации {new Date(user?.created_at ).toLocaleDateString()}
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<Logout />}
                        onClick={handleLogout}
                        sx={{ ml: 'auto' }}
                    >
                        Logout
                    </Button>
                </Box>
            </Paper>

            {message && (
                <Alert severity={message.type} sx={{ mb: 3 }}>
                    {message.text}
                </Alert>
            )}

            {/* Tabs */}
            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
                <Tab icon={<Person />} label="Profile" />
                <Tab icon={<Lock />} label="Security" />
                <Tab icon={<History />} label="Activity" />
            </Tabs>

            {/* Profile Tab */}
            {tab === 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Редактирование профиля
                        </Typography>
                        <form onSubmit={handleUpdateProfile}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Имя"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        startIcon={<Edit />}
                                    >
                                        {loading ? <CircularProgress size={20} /> : 'Обновить профиль'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Security Tab */}
            {tab === 1 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Сменить пароль
                        </Typography>
                        <form onSubmit={handleUpdatePassword}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Текщий пароль"
                                        type="password"
                                        value={passwords.current_password}
                                        onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Новый пароль"
                                        type="password"
                                        value={passwords.password}
                                        onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Подтверждение пароля"
                                        type="password"
                                        value={passwords.password_confirmation}
                                        onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        startIcon={<Lock />}
                                    >
                                        {loading ? <CircularProgress size={20} /> : 'Обновить пароль'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Activity Tab */}
            {tab === 2 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Недавняя активность
                        </Typography>
                        <List>
                            {[
                                { icon: <Dashboard />, text: 'Вход', time: 'Только что' },
                                { icon: <Edit />, text: 'Обновление профиля', time: '2 часа назад' },
                                { icon: <Lock />, text: 'Изменение пароля', time: '1 неделя назад' },
                            ].map((activity, index) => (
                                <ListItem key={index}>
                                    <ListItemIcon>{activity.icon}</ListItemIcon>
                                    <ListItemText primary={activity.text} secondary={activity.time} />
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}
        </Container>
    );
};

export default Account;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';
import {
    AppBar,
    Avatar,
    Badge,
    Box,
    Card,
    CardContent,
    Container,
    Divider,
    Drawer,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
    ExitToApp as LogoutIcon,
    AccountCircle,
    TrendingUp,
    AttachMoney,
    ShoppingCart,
    Assessment,
    ChevronRight,
} from '@mui/icons-material';

const drawerWidth = 280;

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await authAPI.getDashboard();
            setDashboardData(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setAnchorEl(null);
        await logout();
        navigate('/login');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const statsCards = [
        {
            title: 'Total Revenue',
            value: '$54,239',
            change: '+12.5%',
            icon: <AttachMoney />,
            color: '#4caf50',
            bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
            title: 'Total Users',
            value: dashboardData?.stats?.total_users || '1,234',
            change: '+3.2%',
            icon: <PeopleIcon />,
            color: '#2196f3',
            bg: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
        },
        {
            title: 'Orders',
            value: '456',
            change: '+5.7%',
            icon: <ShoppingCart />,
            color: '#ff9800',
            bg: 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)',
        },
        {
            title: 'Growth',
            value: '23.5%',
            change: '+2.1%',
            icon: <TrendingUp />,
            color: '#f44336',
            bg: 'linear-gradient(135deg, #FF5252 0%, #F48FB1 100%)',
        },
    ];

    const drawer = (
        <Box>
            <Box sx={{ p: 2.5, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" color="primary">
                    Admin Panel
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Management Dashboard
                </Typography>
            </Box>
            <Divider />
            <List>
                {[
                    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
                    { text: 'Users', icon: <PeopleIcon />, path: '/users' },
                    { text: 'Analytics', icon: <Assessment />, path: '/analytics' },
                    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
                ].map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton selected={item.path === '/dashboard'}>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                            <ChevronRight fontSize="small" />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            {/* App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Dashboard
                    </Typography>

                    {/* Notifications */}
                    <IconButton color="inherit">
                        <Badge badgeContent={4} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    {/* User Menu */}
                    <IconButton
                        color="inherit"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                    >
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem disabled>
                            <Typography variant="body2">
                                Signed in as <strong>{user?.name}</strong>
                            </Typography>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                            <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
                            Profile
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Drawer */}
            <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    mt: 8,
                }}
            >
                <Container maxWidth="xl">
                    {/* Welcome Message */}
                    <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <Typography variant="h5" gutterBottom>
                            Welcome back, {user?.name || 'User'}! 👋
                        </Typography>
                        <Typography variant="body1">
                            Here's what's happening with your projects today.
                        </Typography>
                    </Paper>

                    {/* Stats Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {statsCards.map((stat, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        background: stat.bg,
                                        color: 'white',
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                    {stat.title}
                                                </Typography>
                                                <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>
                                                    {stat.value}
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                    {stat.change} from last month
                                                </Typography>
                                            </Box>
                                            <Box sx={{ opacity: 0.8 }}>
                                                {stat.icon}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Recent Activity */}
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Recent Activity
                                    </Typography>
                                    {dashboardData?.recent_activity?.map((activity) => (
                                        <Box
                                            key={activity.id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                py: 1.5,
                                                borderBottom: '1px solid',
                                                borderColor: 'divider',
                                            }}
                                        >
                                            <Avatar sx={{ mr: 2, width: 40, height: 40, bgcolor: 'primary.main' }}>
                                                <AccountCircle />
                                            </Avatar>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {activity.action}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* User Info Card */}
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Profile
                                    </Typography>
                                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                                        <Avatar
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                mx: 'auto',
                                                mb: 2,
                                                bgcolor: 'primary.main',
                                                fontSize: 32,
                                            }}
                                        >
                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </Avatar>
                                        <Typography variant="h6">{user?.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {user?.email}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Role</Typography>
                                        <Typography variant="body2" fontWeight="bold">{user?.role || 'Admin'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">Member since</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
};

export default Dashboard;
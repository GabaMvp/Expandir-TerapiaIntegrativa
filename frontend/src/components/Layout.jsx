import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard,
    People,
    CalendarToday,
    MedicalServices,
    Logout,
    AdminPanelSettings,
    PersonAdd,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 260;

export default function Layout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    const nomeCompleto = user?.nome || 'Psicólogo';

    const primeiroNome =
        nomeCompleto !== 'Psicólogo'
            ? nomeCompleto.trim().split(' ')[0]
            : 'Psicólogo';

    const inicial =
        nomeCompleto !== 'Psicólogo'
            ? nomeCompleto.trim().charAt(0).toUpperCase()
            : 'P';

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        handleMenuClose();
    };

    const menuItems = [
        {
            text: 'Dashboard',
            icon: <Dashboard />,
            path: '/',
        },
        {
            text: 'Pacientes',
            icon: <People />,
            path: '/pacientes',
        },
        {
            text: 'Agenda',
            icon: <CalendarToday />,
            path: '/agenda',
        },
        {
            text: 'Prontuários',
            icon: <MedicalServices />,
            path: '/prontuarios',
        },
    ];

    const adminMenuItems = [
        {
            text: 'Dashboard Admin',
            icon: <AdminPanelSettings />,
            path: '/admin',
        },
        {
            text: 'Criar Psicólogo',
            icon: <PersonAdd />,
            path: '/admin/psicologos/novo',
        },
        {
            text: 'Criar Atendimento',
            icon: <CalendarToday />,
            path: '/admin/atendimentos/novo',
        },
        {
            text: 'Todos os Pacientes',
            icon: <People />,
            path: '/admin/pacientes',
        },
        {
            text: 'Todos os Agendamentos',
            icon: <CalendarToday />,
            path: '/admin/agendamentos',
        },
    ];

    const drawer = (
        <Box
            sx={{
                height: '100%',
                bgcolor: '#7B944A',
                position: 'relative',
            }}
        >
            <Box sx={{ p: 3 }}>
                <Typography
                    variant="h6"
                    sx={{
                        color: '#fff',
                        fontWeight: 'bold',
                    }}
                >
                    Expandir
                </Typography>

                <Typography
                    variant="caption"
                    sx={{
                        color: 'rgba(255,255,255,0.6)',
                    }}
                >
                    Terapia Integrativa
                </Typography>
            </Box>

            <Divider
                sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                }}
            />

            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => navigate(item.path)}
                        sx={{
                            color: '#fff',
                            mx: 1,
                            borderRadius: 2,
                            width: 'calc(100% - 16px)',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.1)',
                            },
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                color: '#fff',
                                minWidth: 42,
                            }}
                        >
                            {item.icon}
                        </ListItemIcon>

                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>

            {isAdmin && (
                <>
                    <Divider
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.1)',
                        }}
                    />

                    <List>
                        {adminMenuItems.map((item) => (
                            <ListItem
                                button
                                key={item.text}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    color: '#fff',
                                    mx: 1,
                                    borderRadius: 2,
                                    width: 'calc(100% - 16px)',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        color: '#fff',
                                        minWidth: 42,
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>

                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}

            <Box
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    p: 2,
                    boxSizing: 'border-box',
                }}
            >
                <Divider
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                    }}
                />

                <Box
                    onClick={handleMenuOpen}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mt: 2,
                        p: 1,
                        borderRadius: 2,
                        cursor: 'pointer',
                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                        },
                    }}
                >
                    <Avatar
                        sx={{
                            bgcolor: '#687F3E',
                            fontWeight: 'bold',
                        }}
                    >
                        {inicial}
                    </Avatar>

                    <Box
                        sx={{
                            ml: 2,
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        <Typography
                            variant="body2"
                            noWrap
                            sx={{
                                color: '#fff',
                                fontWeight: 500,
                            }}
                        >
                            {primeiroNome}
                        </Typography>

                        <Typography
                            variant="caption"
                            sx={{
                                color: 'rgba(255,255,255,0.5)',
                            }}
                        >
                            {user?.role === 'admin'
                                ? 'Administrador'
                                : 'Psicólogo'}
                        </Typography>
                    </Box>
                </Box>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <Logout fontSize="small" />
                        </ListItemIcon>

                        <ListItemText>
                            Sair
                        </ListItemText>
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: {
                        sm: `calc(100% - ${drawerWidth}px)`,
                    },
                    ml: {
                        sm: `${drawerWidth}px`,
                    },
                    bgcolor: '#fff',
                    color: '#1a1a2e',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{
                            mr: 2,
                            display: {
                                sm: 'none',
                            },
                        }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography
                        variant="h6"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 500,
                        }}
                    >
                        {`Olá, ${nomeCompleto}`}
                    </Typography>

                    <IconButton onClick={handleMenuOpen}>
                        <Avatar
                            sx={{
                                width: 34,
                                height: 34,
                                bgcolor: '#687F3E',
                                fontWeight: 'bold',
                            }}
                        >
                            {inicial}
                        </Avatar>
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{
                    width: {
                        sm: drawerWidth,
                    },
                    flexShrink: {
                        sm: 0,
                    },
                }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: {
                            xs: 'block',
                            sm: 'none',
                        },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer>

                <Drawer
                    variant="permanent"
                    sx={{
                        display: {
                            xs: 'none',
                            sm: 'block',
                        },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: {
                        sm: `calc(100% - ${drawerWidth}px)`,
                    },
                    mt: 8,
                    bgcolor: '#f5f7fb',
                    minHeight: '100vh',
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
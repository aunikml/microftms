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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as TrainerIcon,
  Group as TraineeIcon,
  LocalShipping as LogisticIcon,
  ExitToApp as LogoutIcon,
  Brightness4,
  Brightness7,
  Settings,
  CalendarToday as CalendarIcon,
  FactCheck as RequestIcon,
  Class as CohortIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';

const drawerWidth = 260;

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    if (user?.role === 'regional_manager') {
      return [
        { 
          text: 'RM Dashboard', 
          icon: <DashboardIcon />, 
          path: '/rm-dashboard', 
          roles: ['regional_manager'] 
        }
      ];
    }

    if (user?.role === 'program_supervisor') {
      return [
        { 
          text: 'Dashboard', 
          icon: <DashboardIcon />, 
          path: '/dashboard', 
          roles: ['program_supervisor'] 
        }
      ];
    }

    const isTrainer = ['trainer', 'master_trainer'].includes(user?.role);
    const items = [
      { 
        text: isTrainer ? 'My Batches' : 'Dashboard', 
        icon: isTrainer ? <TrainerIcon /> : <DashboardIcon />, 
        path: '/dashboard', 
        roles: ['all'] 
      },
      { text: 'Calendar', icon: <CalendarIcon />, path: '/calendar', roles: ['all'] }
    ];

    if (['super_admin', 'program_supervisor'].includes(user?.role)) {
      items.push({ 
        text: 'RM Dashboard', 
        icon: <DashboardIcon />, 
        path: '/rm-dashboard', 
        roles: ['super_admin', 'program_supervisor'] 
      });
    }

    if (user?.role === 'super_admin') {
      items.push({ text: 'User Management', icon: <PeopleIcon />, path: '/users', roles: ['super_admin'] });
      items.push({ text: 'Divisions & Regional Office', icon: <BusinessIcon />, path: '/regional-offices', roles: ['super_admin'] });
      items.push({ text: 'Google Integrations', icon: <Settings />, path: '/google-integrations', roles: ['super_admin'] });
    }

    // Program Supervisor or Super Admin
    if (['super_admin', 'program_supervisor'].includes(user?.role)) {
      items.push({ text: 'Trainer Management', icon: <TrainerIcon />, path: '/trainers', roles: ['super_admin', 'program_supervisor'] });
    }

    // Batch Manager, Super Admin, Program Supervisor
    if (['super_admin', 'program_supervisor', 'batch_manager'].includes(user?.role)) {
      items.push({ text: 'Trainee Management', icon: <TraineeIcon />, path: '/trainees', roles: ['super_admin', 'program_supervisor', 'batch_manager'] });
      items.push({ text: 'Cohort Management', icon: <CohortIcon />, path: '/cohorts', roles: ['super_admin', 'program_supervisor', 'batch_manager'] });
    }

    // Logistic Manager, Super Admin
    if (['super_admin', 'logistic_manager'].includes(user?.role)) {
      items.push({ text: 'Logistics Inventory', icon: <LogisticIcon />, path: '/logistics', roles: ['super_admin', 'logistic_manager'] });
      items.push({ text: 'Logistics Requests', icon: <RequestIcon />, path: '/logistics/requests', roles: ['super_admin', 'logistic_manager'] });
    }

    return items;
  };

  const menuItems = getMenuItems();

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box 
          sx={{ 
            width: 38, 
            height: 38, 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800
          }}
        >
          T
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
          TMS Panel
        </Typography>
      </Box>

      <Divider sx={{ opacity: 0.6 }} />

      {/* Navigation List */}
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: '8px',
                py: 1,
                px: 1.5,
                '&:hover': {
                  bgcolor: mode === 'light' ? 'rgba(79, 70, 229, 0.04)' : 'rgba(99, 102, 241, 0.08)',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>
                    {item.text}
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ opacity: 0.6 }} />

      {/* User Info Bottom */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 600 }}>
          {user?.first_name?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, noWrap: true }}>
            {user?.full_name || 'TMS User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'capitalize' }}>
            {user?.role?.replace('_', ' ') || 'Role'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              System Dashboard
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Theme Toggle */}
            <Tooltip title="Toggle light/dark mode">
              <IconButton onClick={toggleColorMode} color="inherit">
                {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>

            {/* Profile Dropdown */}
            <Tooltip title="Account settings">
              <IconButton onClick={handleProfileMenuOpen} size="small" sx={{ ml: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                  {user?.first_name?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 180,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: (theme) => `1px solid ${theme.palette.divider}`
                }
              }}
            >
              <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/dashboard'); }}>
                <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                Profile Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawers */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
          }}
        >
          {sidebarContent}
        </Drawer>
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth, 
              borderRight: (theme) => `1px solid ${theme.palette.divider}` 
            },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;

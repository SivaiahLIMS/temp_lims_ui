import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Badge, Avatar, Menu, MenuItem,
  Typography, Box, Divider, Select, FormControl, Tooltip,
  alpha, useTheme, ListItemIcon, Chip,
} from '@mui/material';
import {
  NotificationsNone, AccountCircle, Logout, Settings,
  Person, KeyboardArrowDown, DarkMode, LightMode,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

const BRANCHES = [
  { id: 1, name: 'Main Branch' },
  { id: 2, name: 'North Lab' },
  { id: 3, name: 'South Lab' },
];

export default function TopBar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, notifications, currentBranchId, setCurrentBranchId } = useUIStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const drawerWidth = sidebarCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/login');
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - ${drawerWidth}px)`,
        ml: `${drawerWidth}px`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important', gap: 1 }}>
        {/* Branch selector */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={currentBranchId}
            onChange={(e) => setCurrentBranchId(Number(e.target.value))}
            IconComponent={KeyboardArrowDown}
            sx={{
              fontSize: 13,
              fontWeight: 500,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
              '& .MuiSelect-select': { py: 0.75, px: 1.5 },
              borderRadius: 1.5,
            }}
          >
            {BRANCHES.map((b) => (
              <MenuItem key={b.id} value={b.id} sx={{ fontSize: 13 }}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            size="small"
            onClick={(e) => setNotifAnchor(e.currentTarget)}
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
            }}
          >
            <Badge badgeContent={notifications || null} color="error" max={99}>
              <NotificationsNone fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User menu */}
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            px: 1,
            py: 0.5,
            borderRadius: 1.5,
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
          }}
        >
          <Avatar
            sx={{
              width: 30,
              height: 30,
              bgcolor: theme.palette.primary.main,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {initials}
          </Avatar>
          {user && (
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
                {user.username}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1 }}>
                Administrator
              </Typography>
            </Box>
          )}
          <KeyboardArrowDown sx={{ fontSize: 16, color: 'text.secondary' }} />
        </Box>

        {/* User dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: { mt: 0.5, minWidth: 200, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{user?.username}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Tenant #{user?.tenantId}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }} sx={{ fontSize: 13, gap: 1.5 }}>
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            My Profile
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }} sx={{ fontSize: 13, gap: 1.5 }}>
            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ fontSize: 13, gap: 1.5, color: 'error.main' }}>
            <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            Sign Out
          </MenuItem>
        </Menu>

        {/* Notifications dropdown */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: { mt: 0.5, width: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Notifications</Typography>
            {notifications > 0 && <Chip label={notifications} color="error" size="small" sx={{ height: 20, fontSize: 11 }} />}
          </Box>
          <Divider />
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <NotificationsNone sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No new notifications</Typography>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

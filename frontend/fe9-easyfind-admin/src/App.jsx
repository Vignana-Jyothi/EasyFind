import { useState,useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { styled, createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import axios from "axios";
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckIcon from '@mui/icons-material/Check';
import PeopleIcon from '@mui/icons-material/People';
import UploadIcon from '@mui/icons-material/Upload';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LockIcon from '@mui/icons-material/Lock';
import Admin from './components/Login';
import AdminDashboard from "./components/Dashboard";
import ApproveItems from "./components/ManageItems";
import GiveToStudent from "./components/GiveToStudent";
import UploadItem from "./components/UploadItem";
import ChangePassword from "./components/ChangePassword";
import EditItem from "./components/EditItem"
import GoogleLoginButton from './components/GoogleLoginButton';
import ProtectedRoute from './contexts/ProtectedRoute'
import NotFound from './components/NotFound';

const drawerWidth = 240;
const AppBar = styled(MuiAppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

const menuItems = [
  { text: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
  { text: 'Approve Items', path: '/admin/approve', icon: <CheckIcon /> },
  { text: 'Give to Student', path: '/admin/give', icon: <PeopleIcon /> },
  { text: 'Upload Item', path: '/admin/upload', icon: <UploadIcon /> },
  { text: 'Edit Items', path: '/admin/edit', icon: <CheckIcon /> },
  // { text: 'Change Password', path: '/admin/change-password', icon: <LockIcon /> }
];




function AppContent() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const API_URL = import.meta.env.VITE_AUTH_BASE_URL;

  const handleDrawerToggle = () => setOpen(!open);
  const handleLogout = () => {
    axios.post(`${API_URL}/logout`, {}, { withCredentials: true })
      .finally(() => {
        window.location.href = '/login';
      });
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <IconButton color="inherit" onClick={handleDrawerToggle} edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Admin Dashboard</Typography>
        </Toolbar>
      </AppBar>
      <MuiDrawer variant="temporary" open={open} onClose={handleDrawerToggle} sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}>
        <Toolbar><IconButton onClick={handleDrawerToggle}><ChevronLeftIcon /></IconButton></Toolbar>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} component={Link} to={item.path} onClick={handleDrawerToggle}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
          <ListItem button onClick={handleLogout}>
            <ListItemIcon><ExitToAppIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </MuiDrawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        <Toolbar />
        <Container maxWidth="lg">
          <Routes>
            <Route path="/login" element={<GoogleLoginButton />} />
            <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/approve" element={<ProtectedRoute><ApproveItems /></ProtectedRoute>} />
            <Route path="/admin/give" element={<ProtectedRoute><GiveToStudent /></ProtectedRoute>} />
            <Route path="/admin/upload" element={<ProtectedRoute><UploadItem /></ProtectedRoute>} />
            <Route path="/admin/edit" element={<ProtectedRoute><EditItem/></ProtectedRoute>} />
            {/* <Route path="/admin/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} /> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={createTheme()}>
        <AppContent />
      </ThemeProvider>
    </Router>
  );
}

export default App;

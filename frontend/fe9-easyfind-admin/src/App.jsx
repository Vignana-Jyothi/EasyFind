import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  LayoutDashboard, 
  Sparkles, 
  ClipboardList, 
  PlusCircle, 
  ScanBarcode, 
  LogOut, 
  Bell, 
  Calendar,
  ShieldCheck,
  Edit,
  User
} from 'lucide-react';
import AdminDashboard from "./components/Dashboard";
import ApproveItems from "./components/ManageItems";
import GiveToStudent from "./components/GiveToStudent";
import UploadItem from "./components/UploadItem";
import EditItem from "./components/EditItem";
import NotificationsPage from "./components/NotificationsPage";
import GoogleLoginButton from './components/GoogleLoginButton';
import ProtectedRoute from './contexts/ProtectedRoute';
import NotFound from './components/NotFound';
import AdminProfile from "./components/AdminProfile";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_AUTH_BASE_URL;
  const [currentDate, setCurrentDate] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString(undefined, { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }) + "  |  " + now.toLocaleTimeString(undefined, { 
        hour: 'numeric', 
        minute: '2-digit' 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dynamic admin notifications count
  useEffect(() => {
    if (location.pathname === '/login') return;

    const fetchUnreadCount = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/notifications/admin`,
          { withCredentials: true }
        );
        if (res.data && res.data.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Error fetching admin unread count:", err);
      }
    };

    fetchUnreadCount();
    
    const handleNotificationsUpdate = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notificationsUpdated', handleNotificationsUpdate);

    // Periodically fetch notifications count (every 15 seconds)
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdate);
      clearInterval(interval);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    axios.post(`${API_URL}/logout`, {}, { withCredentials: true })
      .finally(() => {
        window.location.href = '/login';
      });
  };

  const isLoginPage = location.pathname === '/login';

  const menuItems = [
    { text: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { text: 'AI Matches', path: '/admin/approve', icon: Sparkles },
    { text: 'Notifications', path: '/admin/notifications', icon: Bell, showBadge: true },
    { text: 'Lost Items', path: '/admin', icon: ClipboardList },
    { text: 'Found Items', path: '/admin/upload', icon: PlusCircle },
    { text: 'Barcode Handover', path: '/admin/give', icon: ScanBarcode },
    { text: 'Edit Items', path: '/admin/edit', icon: Edit },
  ];

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<GoogleLoginButton />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* 1. Left Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 p-6 sticky top-0 h-screen shrink-0 justify-between">
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer mb-2" onClick={() => navigate("/admin")}>
            <img 
              src="https://res.cloudinary.com/dxql68kht/image/upload/fl_preserve_transparency/v1744206896/Screenshot_2025-04-09_191750_kml7qq.jpg?_s=public-apps" 
              alt="EasyFind Logo" 
              className="h-9 w-auto object-contain rounded" 
            />
            <div>
              <span className="font-bold text-slate-800 text-lg tracking-tight block leading-none">EasyFind</span>
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest block mt-0.5">Admin Hub</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.text}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4.5 h-4.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    {item.text}
                  </div>
                  {item.showBadge && unreadCount > 0 && (
                    <span className="bg-rose-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Info & Footer Widgets */}
        <div className="space-y-4">
          {/* Quick Tip Widget */}
          <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 text-center relative overflow-hidden group">
            <ShieldCheck className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-[11px]">Quick Tip</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Verify student ID using barcode scanner to complete secure handover.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all duration-200"
          >
            <LogOut className="w-4.5 h-4.5 text-rose-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* 2. Workspace Body Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* Top Header navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-100 p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">Admin Dashboard</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Manage lost & found operations efficiently</p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            {/* Date Display */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/50 rounded-xl px-3.5 py-2 text-[10px] font-bold text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentDate}</span>
            </div>

            {/* Icons Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/admin/notifications')}
                className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div 
                onClick={() => navigate('/admin/profile')}
                className="flex items-center gap-2.5 border-l border-slate-100 pl-3 cursor-pointer hover:opacity-80 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                  A
                </div>
                <div className="text-left font-sans">
                  <span className="text-xs font-bold text-slate-850 block leading-none">Admin</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">Security Office</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Workspace Frame content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Routes>
            <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/approve" element={<ProtectedRoute><ApproveItems /></ProtectedRoute>} />
            <Route path="/admin/give" element={<ProtectedRoute><GiveToStudent /></ProtectedRoute>} />
            <Route path="/admin/upload" element={<ProtectedRoute><UploadItem /></ProtectedRoute>} />
            <Route path="/admin/edit" element={<ProtectedRoute><EditItem /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      {/* 3. Bottom Navigation - Mobile Devices (lg:hidden) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around py-2.5 z-40 shadow-lg px-2 text-[10px] font-bold text-slate-400">
        <Link
          to="/admin"
          className={`flex flex-col items-center gap-1 ${
            (location.pathname === "/admin" || location.pathname === "/") ? "text-indigo-600" : "text-slate-400"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link
          to="/admin/approve"
          className={`flex flex-col items-center gap-1 ${
            location.pathname === "/admin/approve" ? "text-indigo-600" : "text-slate-400"
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>AI Matches</span>
        </Link>
        <Link
          to="/admin/upload"
          className={`flex flex-col items-center gap-1 ${
            location.pathname === "/admin/upload" ? "text-indigo-600" : "text-slate-400"
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Found</span>
        </Link>
        <Link
          to="/admin/give"
          className={`flex flex-col items-center gap-1 ${
            location.pathname === "/admin/give" ? "text-indigo-600" : "text-slate-400"
          }`}
        >
          <ScanBarcode className="w-5 h-5" />
          <span>Handover</span>
        </Link>
        <Link
          to="/admin/notifications"
          className={`flex flex-col items-center gap-1 relative ${
            location.pathname === "/admin/notifications" ? "text-indigo-600" : "text-slate-400"
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <span>Alerts</span>
        </Link>
        <Link
          to="/admin/profile"
          className={`flex flex-col items-center gap-1 ${
            location.pathname === "/admin/profile" ? "text-indigo-600" : "text-slate-400"
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

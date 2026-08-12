import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { 
  Home, 
  ClipboardList, 
  Eye, 
  Search, 
  FileText, 
  Bell, 
  User, 
  LogOut
} from "lucide-react";
import Header from "../components/NavBar";

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuItems = [
    { text: "Dashboard", path: "/dashboard", icon: Home },
    { text: "Report Lost Item", path: "/dashboard/lost-item", icon: ClipboardList },
    { text: "Report Found Item", path: "/dashboard/report-item", icon: Eye },
    { text: "Search Items", path: "/dashboard/search-item", icon: Search },
    { text: "My Reports", path: "/dashboard/my-reports", icon: FileText },
    { text: "Notifications", path: "/notifications", icon: Bell },
    { text: "Profile", path: "/profile", icon: User },
  ];

  // Fetch dynamic unread count from the backend
  useEffect(() => {
    if (!user?.email) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/notifications`,
          { withCredentials: true }
        );
        if (res.data && res.data.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Error fetching notification count:", err);
      }
    };

    fetchUnreadCount();
    
    const handleNotificationsUpdate = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notificationsUpdated', handleNotificationsUpdate);
    
    // Auto-refresh notifications count periodically (every 15 seconds)
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdate);
      clearInterval(interval);
    };
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* 1. Left Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 p-6 sticky top-0 h-screen shrink-0 justify-between">
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer mb-2" onClick={() => navigate("/dashboard")}>
            <img 
              src="https://res.cloudinary.com/dxql68kht/image/upload/fl_preserve_transparency/v1744206896/Screenshot_2025-04-09_191750_kml7qq.jpg?_s=public-apps" 
              alt="EasyFind Logo" 
              className="h-9 w-auto object-contain rounded" 
            />
            <div>
              <span className="font-bold text-slate-800 text-lg tracking-tight block leading-none">EasyFind</span>
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest block mt-0.5">Lost & Found</span>
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
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <div className="relative flex items-center gap-3.5 w-full">
                    <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>{item.text}</span>
                    {item.text === "Notifications" && unreadCount > 0 && (
                      <span className="ml-auto bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Card */}
        <div className="space-y-4">
          <button
            onClick={logout}
            className="flex items-center gap-3.5 px-4 py-3 w-full rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px] text-rose-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* 2. Right Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* Top Header Navigation */}
        <Header unreadCount={unreadCount} />
        
        {/* Main Routed Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* 3. Bottom Navigation - Mobile Devices */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around py-2.5 z-40 shadow-lg px-2">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            location.pathname === "/dashboard" && !location.search.includes("focus") ? "text-indigo-600" : "text-slate-400"
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link
          to="/dashboard/search-item"
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            location.pathname === "/dashboard/search-item" ? "text-indigo-600" : "text-slate-400"
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </Link>
        <Link
          to="/dashboard/lost-item"
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            location.pathname === "/dashboard/lost-item" ? "text-indigo-600" : "text-slate-400"
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span>Reports</span>
        </Link>
        <Link
          to="/notifications"
          className={`flex flex-col items-center gap-1 text-[10px] font-bold relative ${
            location.pathname === "/notifications" ? "text-indigo-600" : "text-slate-400"
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
          to="/profile"
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            location.pathname === "/profile" ? "text-indigo-600" : "text-slate-400"
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;

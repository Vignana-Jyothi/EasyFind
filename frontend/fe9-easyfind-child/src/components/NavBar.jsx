import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, AlertCircle, Bell, User, Search, LogOut, HeartHandshake } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/dashboard/lost-item', icon: AlertCircle, label: 'Report Lost' },
    { path: '/dashboard/report-item', icon: HeartHandshake, label: 'Report Found' },
    { path: '/dashboard/search-item', icon: Search, label: 'Search Items' },
    { path: '/dashboard/user-profile', icon: User, label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-150 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm">
      {/* Brand logo on Mobile only */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <img 
          src="https://res.cloudinary.com/dxql68kht/image/upload/fl_preserve_transparency/v1744206896/Screenshot_2025-04-09_191750_kml7qq.jpg?_s=public-apps" 
          alt="EasyFind Logo" 
          className="h-8.5 w-auto object-contain rounded" 
        />
        <div className="lg:hidden">
          <span className="font-bold text-slate-800 text-base tracking-tight block leading-none">EasyFind</span>
          <span className="text-[9px] font-semibold text-indigo-600 uppercase tracking-widest block mt-0.5">Lost & Found</span>
        </div>
      </div>

      {/* Center Nav tabs - Desktop */}
      {user && (
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-slate-100 text-indigo-600" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      )}

      {/* Right User Bar */}
      {user && (
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard?focus=notifications')}
            className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-2.5 border-l border-slate-100 pl-3">
            {/* Student avatar placeholder */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-slate-800 block leading-none">{user.name || 'Student'}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">{user.email ? user.email.split('@')[0].toUpperCase() : ''}</span>
            </div>
          </div>

          <button 
            onClick={logout}
            className="md:hidden p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
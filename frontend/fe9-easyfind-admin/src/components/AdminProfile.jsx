import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Award, ShieldCheck, BookOpen, LogOut, Clock } from 'lucide-react';

const AdminProfile = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const BE_URL = import.meta.env.VITE_EASYFIND_BACKEND_URL;
  const API_URL = import.meta.env.VITE_AUTH_BASE_URL;

  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const res = await axios.get(`${BE_URL}/auth/admin/check-auth`, {
          withCredentials: true
        });
        if (res.data && res.data.user) {
          setAdmin(res.data.user);
        } else {
          setError("Failed to parse admin session details.");
        }
      } catch (err) {
        console.error("Admin details fetch error:", err);
        setError("Unable to retrieve admin profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDetails();
  }, [BE_URL]);

  const handleLogout = () => {
    axios.post(`${API_URL}/logout`, {}, { withCredentials: true })
      .finally(() => {
        window.location.href = '/login';
      });
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-2 font-sans">
        <svg className="animate-spin h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-[11px] text-slate-400 font-medium">Loading profile...</span>
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="text-center py-12 font-sans">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h4 className="text-slate-800 font-bold text-sm">Profile Load Error</h4>
        <p className="text-xs text-slate-400 mt-1">{error || "Please log in to view the admin profile."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Admin Profile</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Manage and view Security Office administrative credentials verified by Single Sign-On.</p>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center">
          {/* Profile Photo */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-3xl shadow-md mb-4 shadow-indigo-100">
            {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
          </div>
          
          <h3 className="font-extrabold text-slate-800 text-lg">{admin.name || 'Security Office Admin'}</h3>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Authorized Administrator</span>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-5 text-sm font-semibold text-slate-650 max-w-md mx-auto">
          <div className="flex items-center gap-4">
            <User className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="w-full">
              <span className="text-[10px] text-slate-400 block leading-none font-bold uppercase tracking-wider">Full Name</span>
              <span className="text-slate-800 mt-1.5 block">{admin.name || 'Admin'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Award className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="w-full">
              <span className="text-[10px] text-slate-400 block leading-none font-bold uppercase tracking-wider">Designation</span>
              <span className="text-slate-800 mt-1.5 block font-mono">Security Office Administrator</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Mail className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="w-full">
              <span className="text-[10px] text-slate-400 block leading-none font-bold uppercase tracking-wider">Email Address</span>
              <span className="text-slate-800 mt-1.5 block truncate">{admin.email || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <BookOpen className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="w-full">
              <span className="text-[10px] text-slate-400 block leading-none font-bold uppercase tracking-wider">Department / Section</span>
              <span className="text-slate-800 mt-1.5 block">{admin.department || "Not Available"}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3.5 px-4 rounded-2xl text-xs transition duration-200 mt-6 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;

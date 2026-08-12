import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Award, ShieldCheck, BookOpen, LogOut } from 'lucide-react';

const StudentProfile = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-12">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h4 className="text-slate-800 font-bold text-sm">Authentication Required</h4>
        <p className="text-xs text-slate-400 mt-1">Please log in to view your student profile.</p>
      </div>
    );
  }

  const extractRollNumber = (email) => {
    const atIndex = email?.indexOf('@');
    if (atIndex === -1) return 'Invalid email';
    return email?.substring(0, atIndex)?.toUpperCase();
  };

  const rollNumber = extractRollNumber(user?.email);



  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Student Profile</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Manage and view your college credentials verified by the Single Sign-On system.</p>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center">
          {/* Profile Photo */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-3xl shadow-md mb-4 shadow-indigo-100">
            {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          
          <h3 className="font-extrabold text-slate-800 text-lg">{user.name || 'Student'}</h3>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Registered Student</span>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-5 text-sm font-semibold text-slate-650 max-w-md mx-auto">
          <div className="flex items-center gap-4">
            <User className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="w-full">
              <span className="text-[10px] text-slate-400 block leading-none font-bold uppercase tracking-wider">Full Name</span>
              <span className="text-slate-800 mt-1.5 block">{user.name || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Award className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="w-full">
              <span className="text-[10px] text-slate-400 block leading-none font-bold uppercase tracking-wider">Roll Number</span>
              <span className="text-slate-800 mt-1.5 block font-mono">{rollNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Mail className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="w-full">
              <span className="text-[10px] text-slate-400 block leading-none font-bold uppercase tracking-wider">Email Address</span>
              <span className="text-slate-800 mt-1.5 block truncate">{user.email || 'N/A'}</span>
            </div>
          </div>



          <button
            onClick={logout}
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

export default StudentProfile;

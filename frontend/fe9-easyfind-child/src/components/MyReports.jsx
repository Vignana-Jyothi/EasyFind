import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReportedItems from './ReportedItems';
import LostItems from './LostItems';
import { ShieldCheck } from 'lucide-react';

const MyReportsPage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-12">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h4 className="text-slate-800 font-bold text-sm">Authentication Required</h4>
        <p className="text-xs text-slate-400 mt-1">Please log in to view your reports.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">My Reports & Claims</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium font-sans">Manage your active lost reports and view claims for found items you reported on campus.</p>
      </div>

      {/* Lost Reports Section */}
      <LostItems />

      {/* Reported Found Items (Claims) Section */}
      <ReportedItems userEmail={user?.email} />
    </div>
  );
};

export default MyReportsPage;

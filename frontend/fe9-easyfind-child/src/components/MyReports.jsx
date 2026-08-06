import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, AlertCircle, Trash2, Calendar, MapPin, Tag, Sparkles } from 'lucide-react';

const MyReportsPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError("");
    try {
      const atIndex = user.email.indexOf("@");
      const rollNo = atIndex !== -1 ? user.email.substring(0, atIndex) : "";

      // 1. Fetch Lost Items
      const lostRes = await axios.get(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/lost-items/${user.email}`,
        { withCredentials: true }
      );
      const lostData = Array.isArray(lostRes.data) ? lostRes.data.map(i => ({ ...i, reportType: 'Lost' })) : [];

      // 2. Fetch Found Items
      let foundData = [];
      if (rollNo) {
        const foundRes = await fetch(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/reported/${rollNo}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (foundRes.ok) {
          const foundJson = await foundRes.json();
          foundData = Array.isArray(foundJson) ? foundJson.map(i => ({ ...i, reportType: 'Found' })) : [];
        }
      }

      // Combine and sort chronologically (descending)
      const combined = [...lostData, ...foundData];
      combined.sort((a, b) => new Date(b.createdAt || b.dateLost || b.reportedDate) - new Date(a.createdAt || a.dateLost || a.reportedDate));
      
      setItems(combined);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError("Failed to load reports and claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.email]);

  const handleDelete = async (item) => {
    const id = item._id;
    const type = item.reportType;
    
    // Optimistic UI update
    setItems(prev => prev.filter(i => i._id !== id));
    setConfirmDelete(null);

    try {
      if (type === 'Lost') {
        await axios.delete(
          `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/lost/${id}`,
          { withCredentials: true }
        );
      } else {
        await axios.delete(
          `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/reported/${id}`,
          { withCredentials: true }
        );
      }
    } catch (err) {
      console.error("Delete report error:", err);
      setError("Failed to delete report.");
      // Rollback
      fetchData();
    }
  };

  const getStatusBadge = (status, reportType) => {
    const normalized = (status || 'pending').toLowerCase();
    
    if (reportType === 'Lost') {
      if (normalized === 'claimed') {
        return {
          text: 'Claimed',
          bg: 'bg-green-50 border-green-200 text-green-700',
          icon: '✅'
        };
      }
      if (normalized === 'match-found') {
        return {
          text: 'Match Found',
          bg: 'bg-emerald-50 border-emerald-250 text-emerald-700',
          icon: '✨'
        };
      }
      if (normalized === 'not-found') {
        return {
          text: 'Not Found',
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          icon: '❌'
        };
      }
      if (normalized === 'rejected') {
        return {
          text: 'Rejected',
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          icon: '❌'
        };
      }
      return {
        text: 'Pending Verification',
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        icon: '🟡'
      };
    } else {
      if (normalized === 'verified' || normalized === 'claimed') {
        return {
          text: 'Handed Over to Security Office',
          bg: 'bg-emerald-50 border-emerald-250 text-emerald-700',
          icon: '🟢'
        };
      }
      return {
        text: 'Pending Handover',
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        icon: '🟡'
      };
    }
  };

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
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in font-sans">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">My Reports & Claims</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Manage your active lost reports and view claims for found items you reported on campus.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <svg className="animate-spin h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-[11px] text-slate-400 font-medium">Loading reports & claims...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <span className="text-xs text-slate-400 font-semibold block">No reports or claims found.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => {
            const statusBadge = getStatusBadge(item.status, item.reportType);
            return (
              <div 
                key={item._id} 
                className="border border-slate-100 bg-white hover:bg-slate-50/50 p-5 rounded-3xl shadow-xs transition-all duration-200 flex flex-col justify-between gap-4 group hover:scale-[1.01]"
              >
                <div className="space-y-4">
                  {/* Header: Item Name, Type, and Status Badge */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-800 text-sm tracking-tight line-clamp-1">
                        {item.itemName}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wide border ${
                        item.reportType === 'Lost' 
                          ? 'bg-rose-50 border-rose-100 text-rose-600' 
                          : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                      }`}>
                        {item.reportType} Report
                      </span>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border uppercase tracking-wider flex items-center gap-1 shrink-0 ${statusBadge.bg}`}>
                      <span>{statusBadge.icon}</span>
                      {statusBadge.text}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 font-semibold border-t border-b border-slate-100 py-3">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Category</span>
                      <span className="text-slate-700 block mt-0.5">{item.category || "General"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Location</span>
                      <span className="text-slate-700 block mt-0.5 truncate">{item.location || item.foundLocation || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Date Reported</span>
                      <span className="text-slate-700 block mt-0.5 font-sans">
                        {new Date(item.createdAt || item.dateLost || item.reportedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Last Updated</span>
                      <span className="text-slate-700 block mt-0.5 font-sans">
                        {new Date(item.updatedAt || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Optional Image for Found Reports */}
                  {item.reportType === 'Found' && item.image?.url && (
                    <img 
                      src={item.image.url} 
                      alt={item.itemName} 
                      className="w-full h-32 object-cover rounded-2xl border border-slate-100 shadow-2xs"
                    />
                  )}

                  {/* Description */}
                  {item.description && (
                    <p className="text-[10px] text-slate-450 italic line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{item.description}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex justify-between items-center">
                  {confirmDelete === item._id ? (
                    <div className="flex items-center justify-between w-full bg-rose-50 border border-rose-100 p-2.5 rounded-xl animate-fade-in gap-3 text-[10px] font-bold">
                      <span className="text-rose-800">Confirm delete?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(item)}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg transition-colors text-[10px] font-bold cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="bg-slate-200 hover:bg-slate-350 text-slate-700 px-3 py-1 rounded-lg transition-colors text-[10px] font-bold cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (item.reportType === 'Found' && (item.status === 'verified' || item.status === 'claimed')) {
                          return;
                        }
                        setConfirmDelete(item._id);
                      }}
                      disabled={item.reportType === 'Found' && (item.status === 'verified' || item.status === 'claimed')}
                      className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all text-xs font-bold border ${
                        item.reportType === 'Found' && (item.status === 'verified' || item.status === 'claimed')
                          ? 'bg-slate-55 border-slate-100 text-slate-300 cursor-not-allowed'
                          : 'bg-slate-50 hover:bg-rose-50 border-slate-100 text-slate-500 hover:text-rose-600 cursor-pointer'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {item.reportType === 'Lost' ? 'Cancel Lost Report' : 'Delete Found Report'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, ShieldCheck } from 'lucide-react';

import { 
  PlusCircle, 
  ScanBarcode, 
  Layers, 
  Sparkles,
  ArrowRight,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  Gift
} from "lucide-react";

const iconMap = {
  PlusCircle,
  ScanBarcode,
  Sparkles,
  Layers,
  ClipboardList: Layers,
  Eye: Layers,
  CheckCircle2,
  AlertCircle,
  Gift,
  Bell
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const getNotificationDestination = (title) => {
    const t = (title || "").toLowerCase();
    if (t.includes("new lost") || t.includes("new found") || t.includes("reported")) {
      return "/admin/approve";
    }
    if (t.includes("handover") || t.includes("handed over") || t.includes("claim")) {
      return "/admin/give";
    }
    return null;
  };

  

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const fetchAdminNotifications = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/notifications/admin`,
        { withCredentials: true }
      );
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error("Error fetching admin notifications page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminNotifications();
    const interval = setInterval(fetchAdminNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, isAlreadyRead) => {
    if (isAlreadyRead) return;
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/notifications/${id}/read`,
        {},
        { withCredentials: true }
      );
      if (res.data && res.data.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
        window.dispatchEvent(new Event('notificationsUpdated'));
      }
    } catch (err) {
      console.error("Error marking admin notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/notifications/read-all-admin`,
        {},
        { withCredentials: true }
      );
      if (res.data && res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setStatusMessage({ text: "All notifications marked as read.", type: "success" });
        window.dispatchEvent(new Event('notificationsUpdated'));
      } else {
        setStatusMessage({ text: "Unable to mark notifications as read. Please try again.", type: "error" });
      }
    } catch (err) {
      console.error("Error marking all read:", err);
      setStatusMessage({ text: "Unable to mark notifications as read. Please try again.", type: "error" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Admin System Notifications</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Monitor student reports, handover updates, and student activity logs.</p>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-indigo-650 hover:text-indigo-850"
          >
            Mark all as read
          </button>
        )}
      </div>

      {statusMessage.text && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 border animate-fade-in ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        {loading ? (
          <div className="py-12 flex justify-center">
            <svg className="animate-spin h-6 w-6 text-slate-350" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold">System log notifications are currently empty.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => {
              const IconComponent = iconMap[notif.icon] || Bell;
              const typeColors = {
                success: "text-emerald-500 bg-emerald-50",
                info: "text-blue-500 bg-blue-50",
                warning: "text-amber-500 bg-amber-50",
                error: "text-rose-500 bg-rose-50"
              };
              const colorClass = typeColors[notif.type] || typeColors.info;

              const destination = getNotificationDestination(notif.title);
              const isClickable = !!destination;

              return (
                <div 
                  key={notif._id}
                  onClick={async () => {
                    await handleMarkAsRead(notif._id, notif.isRead);
                    if (isClickable) {
                      navigate(destination);
                    }
                  }}
                  className={`flex gap-4 items-start p-4 rounded-2xl border transition-all duration-200 ${
                    isClickable 
                      ? "cursor-pointer hover:bg-slate-50/50 hover:scale-[1.005] shadow-2xs" 
                      : "cursor-default"
                  } ${
                    notif.isRead 
                      ? "bg-white border-slate-100" 
                      : "bg-indigo-50/30 border-indigo-100/50"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${colorClass}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className={`font-bold text-slate-800 text-sm ${!notif.isRead && "text-indigo-950 font-black"}`}>
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold ml-2">
                        {getRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">{notif.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

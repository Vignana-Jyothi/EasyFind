import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Trash2, AlertCircle, FileSpreadsheet, MapPin, Calendar, Tag } from "lucide-react";

function LostItems() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!user?.email) return;

    const getItems = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/lost-items/${user.email}`,
          { withCredentials: true }
        );
        const data = Array.isArray(res.data) ? res.data : [];
        data.sort((a, b) => new Date(b.createdAt || b.dateLost) - new Date(a.createdAt || a.dateLost));
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch lost items:", err);
        setError("Failed to load active lost reports.");
      } finally {
        setLoading(false);
      }
    };

    getItems();
  }, [user?.email]);

  const handleDelete = async (id) => {
    const remaining = items.filter((i) => i._id !== id);
    setItems(remaining);
    setConfirmDelete(null);

    try {
      await axios.delete(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/lost/${id}`,
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Delete lost report error:", err);
      setError("Failed to delete report.");
      // Rollback list if delete failed
      const res = await axios.get(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/lost-items/${user.email}`,
        { withCredentials: true }
      );
      const data = Array.isArray(res.data) ? res.data : [];
      data.sort((a, b) => new Date(b.createdAt || b.dateLost) - new Date(a.createdAt || a.dateLost));
      setItems(data);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
      <div>
        <h3 className="font-extrabold text-slate-800 text-base">Active Lost Reports</h3>
        <p className="text-[11px] text-slate-400 font-medium">Below are the items you have reported as lost on campus.</p>
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
          <span className="text-[11px] text-slate-400 font-medium">Loading reports...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <span className="text-xs text-slate-400 font-semibold block">No active lost reports found.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div 
              key={item._id} 
              className="border border-slate-100 bg-slate-50/50 hover:bg-slate-50 p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-4 group hover:scale-[1.01]"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-extrabold text-slate-800 text-xs tracking-tight line-clamp-1">{item.itemName}</span>
                  <span className="shrink-0 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md font-bold text-[9px] uppercase tracking-wide">
                    {item.category || "General"}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Last Seen: {item.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Lost On: {new Date(item.dateLost).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {item.description && (
                    <p className="text-[10px] text-slate-400 italic line-clamp-2 mt-2 pt-1 border-t border-slate-200/40">
                      "{item.description}"
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100/60 flex justify-between items-center">
                {confirmDelete === item._id ? (
                  <div className="flex items-center justify-between w-full bg-rose-50 border border-rose-100 p-2.5 rounded-xl animate-fade-in gap-3 text-[10px] font-bold">
                    <span className="text-rose-800">Confirm delete?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg transition-colors text-[10px] font-bold"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="bg-slate-200 hover:bg-slate-350 text-slate-700 px-3 py-1 rounded-lg transition-colors text-[10px] font-bold"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(item._id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-bold rounded-xl transition-all text-[10px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancel Lost Report
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LostItems;
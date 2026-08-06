import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Trash2, AlertCircle, Sparkles, MapPin, Tag } from "lucide-react";

function ReportedItems() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const getItems = async () => {
      setLoading(true);
      try {
        if (!user?.email) throw new Error("User email is required");

        const atIndex = user.email.indexOf("@");
        if (atIndex === -1) throw new Error("Invalid email format");
        const rollNo = user.email.substring(0, atIndex);

        const response = await fetch(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/reported/${rollNo}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch reported items");
        }

        const data = await response.json();
        const sorted = Array.isArray(data) ? data : [];
        sorted.sort((a, b) => new Date(b.createdAt || b.reportedDate) - new Date(a.createdAt || a.reportedDate));
        setItems(sorted);
      } catch (err) {
        console.error("Failed to fetch reported items:", err);
        setError("Failed to fetch reported items.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      getItems();
    }
  }, [user?.email]);

  const handleDelete = async (id, status) => {
    if (status === "verified" || status === "claimed") return;
    try {
      await axios.delete(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/reported/${id}`, {
        withCredentials: true,
      });
      setItems(items.filter((item) => item._id !== id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Delete reported item error:", err);
      setError("Failed to delete the item.");
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      claimed: "bg-purple-50 border-purple-100 text-purple-600",
      verified: "bg-emerald-50 border-emerald-100 text-emerald-600",
      pending: "bg-blue-50 border-blue-100 text-blue-600"
    };
    return classes[status] || "bg-slate-50 border-slate-200 text-slate-600";
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
      <div>
        <h3 className="font-extrabold text-slate-800 text-base font-sans">Reported Found Items</h3>
        <p className="text-[11px] text-slate-400 font-medium">Claims you submitted for items you found on campus.</p>
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
          <span className="text-[11px] text-slate-400 font-medium">Loading claims...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <span className="text-xs text-slate-400 font-semibold block">No found items reported yet.</span>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li 
              key={item._id} 
              className="border border-slate-100 bg-slate-50/50 hover:bg-slate-50 p-4 rounded-2xl transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:scale-[1.005]"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {item.image?.url ? (
                  <img src={item.image.url} alt={item.itemName} className="w-16 h-16 object-cover rounded-xl shadow-2xs border border-slate-100 shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                )}
                
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-800 text-xs truncate max-w-[140px]">{item.itemName}</span>
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                      Code: {item.code}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold flex-wrap">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {item.category || "General"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.foundLocation}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t border-slate-200/40 sm:border-t-0 pt-3 sm:pt-0 shrink-0">
                <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                  {item.status || "Pending"}
                </span>

                {confirmDelete === item._id ? (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-2 py-1 rounded-xl text-[10px] font-bold text-rose-800 animate-fade-in shrink-0">
                    <span>Delete?</span>
                    <button
                      onClick={() => handleDelete(item._id, item.status)}
                      className="bg-rose-650 hover:bg-rose-700 text-white px-2 py-0.5 rounded-md font-bold"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded-md font-bold"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => item.status !== "verified" && item.status !== "claimed" && setConfirmDelete(item._id)}
                    disabled={item.status === "verified" || item.status === "claimed"}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 ${
                      item.status === "verified" || item.status === "claimed"
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ReportedItems;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  PlusCircle, 
  ScanBarcode, 
  Layers, 
  Sparkles,
  ArrowRight,
  Calendar,
  MapPin,
  Tag
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFound: 0,
    matchesPending: 0,
    itemsReturned: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/found`,
          { withCredentials: true }
        );
        const items = Array.isArray(response.data) ? response.data : [];
        setFoundItems(items);

        // Compute metrics from found items database
        const totalFound = items.length;
        const itemsReturned = items.filter(item => item.status === "claimed").length;
        const matchesPending = items.filter(item => item.status === "verified" && !item.handoverDetails?.studentRollNumber).length;
        
        setStats({
          totalFound,
          matchesPending,
          itemsReturned
        });
      } catch (error) {
        console.error("Dashboard status fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Filter verified items waiting for claim handover
  const verifiedItemsWaiting = foundItems
    .filter(item => item.status === "verified")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Found */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Found Items</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg"><PlusCircle className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalFound}</span>
          </div>
          <span className="text-[9px] text-slate-400 font-medium block mt-2">Active database logs</span>
        </div>

        {/* AI Matches Pending / Verified */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Claim Handover</span>
            <span className="p-1.5 bg-amber-50 text-amber-500 rounded-lg"><Sparkles className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.matchesPending}</span>
          </div>
          <span className="text-[9px] text-slate-450 font-medium block mt-2">Verified items ready to deliver</span>
        </div>

        {/* Items Returned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Returned to Students</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><ScanBarcode className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.itemsReturned}</span>
          </div>
          <span className="text-[9px] text-slate-400 font-medium block mt-2">Handovers securely processed</span>
        </div>
      </div>

      {/* 2. Grid Dashboard Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Awaiting Secure Handover Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-2">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Awaiting Secure Handover</h3>
              <p className="text-[11px] text-slate-400 font-medium">Recovered items verified at security desk waiting to be claimed by students.</p>
            </div>
            <button
              onClick={() => navigate('/admin/edit')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              Manage Inventory
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <svg className="animate-spin h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : verifiedItemsWaiting.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <span className="text-xs text-slate-400 font-semibold block">No items currently awaiting claim</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pr-2">Found Item</th>
                    <th className="pb-3 px-2">Category</th>
                    <th className="pb-3 px-2">Location</th>
                    <th className="pb-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {verifiedItemsWaiting.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-3">
                          {item.image?.url ? (
                            <img src={item.image.url} alt={item.itemName} className="w-10 h-10 rounded-lg object-cover shadow-2xs border border-slate-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
                              <Layers className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{item.itemName}</span>
                            <span className="text-[10px] text-indigo-600 font-mono">Code: {item.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-slate-500">{item.category}</td>
                      <td className="py-3.5 px-2 text-slate-500">{item.foundLocation}</td>
                      <td className="py-3.5 px-2">
                        <button
                          onClick={() => navigate('/admin/give')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-[10px]"
                        >
                          Verify Claim
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column - Handover Launcher & System Logs panel */}
        <div className="space-y-6">
          {/* Quick Handover Widget */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-sm border border-slate-900/50 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-550"></div>
            
            <div className="space-y-4">
              <ScanBarcode className="w-8 h-8 text-indigo-400" />
              <h3 className="font-extrabold text-sm tracking-tight">Barcode Secure Handover</h3>
              <p className="text-[11px] text-indigo-200 leading-relaxed font-semibold">
                Verify student credentials using the scanner or input field to process claim handovers.
              </p>
              
              <button
                onClick={() => navigate('/admin/give')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 text-indigo-950 font-black rounded-xl text-xs transition duration-200 shadow-md"
              >
                Launch Handover Scanner
              </button>
            </div>
          </div>

          {/* Quick Notifications Log Widget */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-1">
              <h3 className="font-extrabold text-slate-800 text-sm">System Logs</h3>
              <button 
                onClick={() => navigate('/admin/notifications')}
                className="text-xs font-bold text-indigo-650 hover:text-indigo-850"
              >
                View Feed
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Check student reports and secure claim verification alerts on the dedicated system alerts channel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

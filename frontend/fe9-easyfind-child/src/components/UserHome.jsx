import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Eye, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  X,
  Layers
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch student items dynamically
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const atIndex = user.email.indexOf("@");
        const rollNo = atIndex !== -1 ? user.email.substring(0, atIndex) : "";

        // 1. Fetch lost items reported by student
        const lostRes = await fetch(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/lost-items/${user.email}`, {
          credentials: "include"
        });
        if (lostRes.ok) {
          const lostData = await lostRes.json();
          setLostItems(lostData);
        }

        // 2. Fetch found items reported by student
        if (rollNo) {
          const foundRes = await fetch(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/reported/${rollNo}`, {
            credentials: "include"
          });
          if (foundRes.ok) {
            const foundData = await foundRes.json();
            setFoundItems(foundData);
          }
        }
      } catch (err) {
        console.error("Dashboard database fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email]);

  // Compute live statistics based on real data
  const stats = [
    { 
      label: "Lost Reports", 
      value: lostItems.length, 
      sub: "Reports logged", 
      badge: `↑ ${lostItems.filter(i => new Date(i.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length} this week`,
      color: "from-rose-50 to-rose-100/50 border-rose-100 text-rose-600"
    },
    { 
      label: "Found Reports", 
      value: foundItems.length, 
      sub: "Items found", 
      badge: `↑ ${foundItems.filter(i => new Date(i.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length} this week`,
      color: "from-emerald-50 to-emerald-100/50 border-emerald-100 text-emerald-600"
    },
    { 
      label: "Ready for Collection", 
      value: foundItems.filter(i => i.status === "verified").length, 
      sub: "Action needed", 
      badge: "~ 0 this week",
      color: "from-blue-50 to-blue-100/50 border-blue-100 text-blue-600"
    },
    { 
      label: "Returned Items", 
      value: foundItems.filter(i => i.status === "claimed").length, 
      sub: "Claims resolved", 
      badge: "~ 0 this week",
      color: "from-purple-50 to-purple-100/50 border-purple-100 text-purple-600"
    }
  ];

  // Combine reported items to display inside the recent logs table
  const recentReports = [...foundItems, ...lostItems.map(i => ({...i, reporterRollNo: 'self_lost'}))]
    .sort((a, b) => new Date(b.createdAt || b.reportedDate) - new Date(a.createdAt || a.reportedDate))
    .slice(0, 5);

  const getStatusBadge = (item) => {
    const isLost = item.reporterRollNo === 'self_lost';
    const status = (item.status || 'pending').toLowerCase();
    
    if (isLost) {
      if (status === 'claimed') {
        return {
          text: 'Claimed',
          bg: 'bg-purple-50 border-purple-100 text-purple-600',
          dot: 'bg-purple-500'
        };
      }
      if (status === 'verified') {
        return {
          text: 'Ready for Collection',
          bg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
          dot: 'bg-emerald-500'
        };
      }
      return {
        text: 'Pending Verification',
        bg: 'bg-blue-50 border-blue-100 text-blue-600',
        dot: 'bg-blue-500'
      };
    } else {
      if (status === 'verified' || status === 'claimed') {
        return {
          text: 'Handed Over to Security Office',
          bg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
          dot: 'bg-emerald-500'
        };
      }
      return {
        text: 'Pending Handover',
        bg: 'bg-amber-50 border-amber-100 text-amber-600',
        dot: 'bg-amber-500'
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Dashboard Welcome Banner */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 group">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
        <div className="absolute left-1/3 -bottom-12 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl"></div>

        <div className="space-y-2.5 max-w-xl text-center md:text-left z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Student'}! 👋
          </h2>
          <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed">
            Submit items you've lost or found on campus, monitor claims, and coordinate collections with the Security Office.
          </p>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 z-10">
          <button
            onClick={() => navigate('/dashboard/lost-item')}
            className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 text-indigo-700 font-bold px-5 py-3 rounded-2xl text-xs transition duration-200 shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2 group"
          >
            <ClipboardList className="w-4 h-4 text-indigo-600 transition-transform group-hover:-translate-y-0.5" />
            Report Lost Item
          </button>
          <button
            onClick={() => navigate('/dashboard/report-item')}
            className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-3 rounded-2xl text-xs transition duration-200 border border-white/20 flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4 text-white" />
            Report Found Item
          </button>
        </div>
      </div>

      {/* 2. Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} border p-5 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01]`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{stat.label}</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{stat.value}</span>
              <span className="text-[10px] text-slate-500 font-medium">{stat.sub}</span>
            </div>
            <span className="inline-block mt-3 text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-100 rounded-full shadow-2xs">
              {stat.badge}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Grid Columns for Recent Reports & Sidebar Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Claims Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-2">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">My Recent Reports</h3>
              <p className="text-[11px] text-slate-400 font-medium">Tracking logs of all your registered lost item claims.</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/my-reports')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs text-slate-400 font-medium">Fetching active claims...</span>
            </div>
          ) : recentReports.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <span className="text-xs text-slate-400 font-medium block">No reported claims found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pr-2">Item</th>
                    <th className="pb-3 px-2 hidden sm:table-cell">Category</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 hidden md:table-cell">Date Reported</th>
                    <th className="pb-3 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {recentReports.map((item) => (
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
                            <span className="font-bold text-slate-800 block text-xs truncate max-w-[120px]">{item.itemName}</span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">{item.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 hidden sm:table-cell">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-bold text-[10px] tracking-wide">
                          {item.category || "General"}
                        </span>
                      </td>
                      <td className="py-3.5 px-2">
                        {(() => {
                          const badge = getStatusBadge(item);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                              {badge.text}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-2 hidden md:table-cell text-slate-400">
                        {new Date(item.createdAt || item.reportedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3.5 pl-2 text-right">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-bold rounded-lg transition-colors text-[10px]"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column - Security Office Details */}
        <div className="space-y-6">
          {/* Refined Security Office Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base">Security Office</h3>
            
            <div className="space-y-4 text-xs text-slate-650 font-semibold">
              <div className="flex gap-3.5 items-start">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Location</span>
                  <span className="text-slate-500 text-[11px] font-medium">B-Block</span>
                </div>
              </div>
              
              <div className="flex gap-3.5 items-start">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Timings</span>
                  <span className="text-slate-500 text-[11px] font-medium">9:00 AM – 4:40 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Campaign Banner */}
      <div className="bg-gradient-to-r from-slate-100 to-indigo-50 border border-slate-200/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 relative overflow-hidden group">
        <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-lg"></div>
        <div className="flex gap-4 items-center text-center sm:text-left flex-col sm:flex-row">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">Together, we make our campus better</h4>
            <p className="text-[11px] text-slate-400 max-w-md mt-1 leading-relaxed">
              Your reports help keep the campus safe and ensure every item finds its way back to its right owner.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/search-item')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition duration-200"
        >
          Start Browsing
        </button>
      </div>

      {/* 5. Item Details Popup Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold">Item Claim Details</h4>
                <p className="text-[10px] text-indigo-200 font-mono mt-0.5">Code: {selectedItem.code || "N/A"}</p>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-white hover:text-indigo-100 p-1 rounded-lg transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {selectedItem.image?.url && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 shadow-2xs">
                  <img src={selectedItem.image.url} alt={selectedItem.itemName} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Item Name</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedItem.itemName}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Category</span>
                    <span className="font-bold text-slate-700 mt-0.5 block">{selectedItem.category || "General"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Status</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] mt-0.5 ${
                      selectedItem.status === 'claimed'
                        ? 'bg-purple-50 text-purple-600'
                        : selectedItem.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {selectedItem.status ? selectedItem.status.toUpperCase() : 'SUBMITTED'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Description</span>
                  <p className="text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 leading-relaxed">
                    "{selectedItem.description}"
                  </p>
                </div>

                {selectedItem.foundLocation && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Reported Location</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">{selectedItem.foundLocation}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Date Reported</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {new Date(selectedItem.createdAt || selectedItem.reportedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="mt-6 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

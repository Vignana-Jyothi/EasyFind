import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Check, 
  Trash2, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle,
  Eye, 
  EyeOff, 
  Info,
  Calendar,
  MapPin,
  Tag,
  User,
  X
} from "lucide-react";

function ManageItems() {
  const [items, setItems] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [view, setView] = useState("pending");
  const [expandedItem, setExpandedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [backendError, setBackendError] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedItemForVerification, setSelectedItemForVerification] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/found`, {
          withCredentials: true,
        });

        const payload = Array.isArray(response.data) ? response.data : [];
        const sortedItems = payload.sort((a, b) => 
          new Date(b.reportedDate) - new Date(a.reportedDate)
        );
        setItems(sortedItems);
      } catch (error) {
        console.error("Error fetching items:", error);
        setBackendError("Failed to load items. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingStatus(true);
    setErrorMessage("");
    setBackendError("");
    setIsSuccess(false);

    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/updatestatus`,
        { id, status: newStatus },
        {
          withCredentials: true,
        }
      );
      
      setItems(items.map(item => (item._id === id ? { ...item, status: newStatus } : item)));
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5500);
    } catch (error) {
      let errorMsg = "An unexpected error occurred. Please try again.";
      
      if (error.response) {
        if (error.response.data.errors) {
          errorMsg = Object.values(error.response.data.errors)
            .map(err => err.message)
            .join(', ');
        } else {
          errorMsg = error.response.data.message || "Server error occurred";
        }
      } else if (error.request) {
        errorMsg = "No response from server. Please check your connection.";
      }
      
      setBackendError(errorMsg);
      setTimeout(() => setBackendError(""), 5000);
    } finally {
      setUpdatingStatus(false);
      setShowImageModal(false);
    }
  };

  const handleVerifyClick = (item) => {
    setSelectedItemForVerification(item);
    setShowImageModal(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    setUpdatingStatus(true);
    setErrorMessage("");
    setBackendError("");
    
    try {
      await axios.delete(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/edit-item/${itemToDelete._id}`,
        { withCredentials: true }
      );
      
      setItems(items.filter(item => item._id !== itemToDelete._id));
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      let errorMsg = "Failed to delete item. Please try again.";
      
      if (error.response) {
        errorMsg = error.response.data.message || "Server error occurred";
      } else if (error.request) {
        errorMsg = "No response from server. Please check your connection.";
      }
      
      setBackendError(errorMsg);
      setTimeout(() => setBackendError(""), 5000);
    } finally {
      setUpdatingStatus(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const filteredItems = items.filter(item =>
    (searchCode ? item.code.includes(searchCode) : true) &&
    (searchCategory ? item.category.toLowerCase().includes(searchCategory.toLowerCase()) : true) &&
    (view === "pending" ? item.status === "pending" : item.status === "verified")
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Approve Logged Items</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Verify newly uploaded found items or check active verified inventory.</p>
      </div>

      {isSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-l-4 border-emerald-400 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          Status updated successfully!
        </div>
      )}
      
      {backendError && (
        <div className="p-4 rounded-2xl bg-rose-50 border-l-4 border-rose-400 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          Error: {backendError}
        </div>
      )}

      {/* Filters Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
        {/* Toggle Pills */}
        <div className="flex gap-2 border-b border-slate-50 pb-4">
          <button 
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              view === "pending" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200/50"
            }`} 
            onClick={() => setView("pending")}
          >
            Pending Approval
          </button>
          <button 
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              view === "verified" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200/50"
            }`} 
            onClick={() => setView("verified")}
          >
            Verified Items
          </button>
        </div>

        {/* Text Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by Code..."
              className="w-full pl-10 pr-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
              onChange={(e) => setSearchCode(e.target.value)}
            />
          </div>
          <div className="flex-1 relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by Category..."
              className="w-full pl-10 pr-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
              onChange={(e) => setSearchCategory(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <svg className="animate-spin h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-2xs">
            <Info className="w-8 h-8 text-slate-350 mx-auto mb-2" />
            <span className="text-xs text-slate-400 font-semibold block">No items match current criteria.</span>
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredItems.map((item) => (
              <li 
                key={item._id} 
                className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 group hover:scale-[1.005]"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-extrabold text-slate-800 text-sm">{item.itemName}</span>
                      <span className="text-[10px] text-indigo-650 bg-indigo-50 font-bold px-2 py-0.5 rounded font-mono">
                        Code: {item.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
                      <span>Category: {item.category}</span>
                      <span>•</span>
                      <span className={item.status === "pending" ? "text-amber-500" : "text-emerald-500"}>
                        Status: {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === "pending" && (
                      <button 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 hover:shadow-lg"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleVerifyClick(item);
                        }}
                        disabled={updatingStatus}
                      >
                        Verify Item
                      </button>
                    )}
                    {item.status === "verified" && (
                      <button 
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleStatusChange(item._id, "pending"); 
                        }}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? "Updating..." : "Undo Verify"}
                      </button>
                    )}
                    <button 
                      className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors border border-slate-100"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDeleteClick(item);
                      }}
                      disabled={updatingStatus}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Section */}
                {expandedItem === item._id && (
                  <div className="mt-5 pt-5 border-t border-slate-100/80 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold text-slate-650 animate-fade-in">
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block leading-none">Category</span>
                          <span className="text-slate-800 mt-1 block">{item.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block leading-none">Location Found</span>
                          <span className="text-slate-800 mt-1 block">{item.foundLocation}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block leading-none">Date Logged</span>
                          <span className="text-slate-800 mt-1 block">
                            {new Date(item.reportedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block leading-none">Reporter ID</span>
                          <span className="text-slate-800 mt-1 block font-mono">{item.reporterRollNo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {item.image?.url && (
                        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs aspect-video max-h-36 relative">
                          <img
                            src={item.image.url}
                            alt={item.itemName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-none">Item Description</span>
                        <p className="text-slate-650 italic mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          "{item.description}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* View Details Toggle */}
                <div className="mt-3 flex justify-start">
                  <button
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1"
                    onClick={() => setExpandedItem(expandedItem === item._id ? null : item._id)}
                  >
                    {expandedItem === item._id ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Show Details
                      </>
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {/* Verification Dialog Overlay */}
      {showImageModal && selectedItemForVerification && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-wider">Verify Item Upload</h4>
                <p className="text-[10px] text-indigo-300 mt-0.5 font-mono">Code: {selectedItemForVerification.code}</p>
              </div>
              <button 
                onClick={() => setShowImageModal(false)}
                className="text-white hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Verify Details of: {selectedItemForVerification.itemName}</h3>
              {selectedItemForVerification.image?.url && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-2xs">
                  <img
                    src={selectedItemForVerification.image.url}
                    alt={selectedItemForVerification.itemName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200/50"
                  onClick={() => setShowImageModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                  onClick={() => handleStatusChange(selectedItemForVerification._id, "verified")}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Verifying..." : "Confirm Verification"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-850 text-center uppercase tracking-wide">Confirm Deletion</h3>
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Are you sure you want to delete this found item record? This will completely purge the record from the database.
              </p>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700 space-y-1">
                <p className="font-extrabold text-slate-850">{itemToDelete.itemName}</p>
                <p className="text-[10px] text-slate-450 font-mono">Code: {itemToDelete.code}</p>
                <p className="text-[10px] text-slate-455">Category: {itemToDelete.category}</p>
              </div>
              
              <p className="text-rose-600 text-[10px] font-bold text-center">⚠️ Warning: This action cannot be undone.</p>
              
              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl text-xs font-bold transition-all border border-slate-200"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                  }}
                  disabled={updatingStatus}
                >
                  Cancel
                </button>
                <button
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 hover:shadow-lg"
                  onClick={handleDeleteConfirm}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Deleting..." : "Delete Item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageItems;
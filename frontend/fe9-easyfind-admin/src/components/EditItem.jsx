import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Layers, 
  MapPin, 
  Calendar, 
  Tag, 
  X, 
  Check, 
  User, 
  Phone, 
  Info 
} from 'lucide-react';

const EditItemPage = () => {
    const [items, setItems] = useState([]);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = Array.isArray(items)
        ? items.filter(item =>
            item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/found`, {
                    withCredentials: true,
                });
                console.log('Fetched items:', res.data);

                if (Array.isArray(res.data)) {
                    setItems(res.data);
                } else {
                    setItems([]);
                    setError(res.data?.message || 'Failed to fetch items');
                }
            } catch (err) {
                setError('Failed to fetch items');
                console.error('Error fetching items:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const handleEditClick = (item) => {
        setEditItem({ 
            ...item,
            claimerDetails: item.claimerDetails || { name: '', rollNo: '', contact: '' }
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setEditItem(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setEditItem(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUpdate = async () => {
        try {
            await axios.put(
                `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/edit-item/${editItem._id}`,
                editItem,
                { withCredentials: true },
            );
            setItems(items.map(item => item._id === editItem._id ? editItem : item));
            setEditItem(null);
        } catch (err) {
            console.error('Error updating item:', err);
            setError('Failed to update item');
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/edit-item/${deleteId}`,
                { withCredentials: true }
            );
            setItems(items.filter((i) => i._id !== deleteId));
            setShowDeleteModal(false);
        } catch (err) {
            console.error('Error deleting item:', err);
            setError('Failed to delete item');
        }
    };

    const getStatusBadge = (status) => {
        const classes = {
            claimed: "bg-purple-55 border-purple-100 text-purple-600",
            verified: "bg-emerald-55 border-emerald-100 text-emerald-600",
            pending: "bg-amber-55 border-amber-100 text-amber-600"
        };
        return classes[status] || "bg-slate-100 border-slate-200 text-slate-650";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manage Inventory</h2>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Update recovered items database, manage claimant tags, or delete records.</p>
                </div>
                {/* Search Bar */}
                <div className="relative sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                        type="text"
                        placeholder="Search by code, category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border-l-4 border-rose-400 text-rose-805 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-2">
                    <svg className="animate-spin h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-xs">
                    <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-semibold">No items match current criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredItems.map((item) => (
                        <div key={item._id} className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group hover:scale-[1.005]">
                            {/* Image Container */}
                            <div className="w-full h-44 bg-slate-50 relative overflow-hidden shrink-0 border-b border-slate-50">
                                {item.image?.url ? (
                                    <img 
                                        src={item.image.url} 
                                        alt={item.itemName}
                                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-350">
                                        <Layers className="w-8 h-8" />
                                    </div>
                                )}
                                {/* Status badge */}
                                <div className="absolute top-2.5 left-2.5 z-10">
                                    <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border shadow-2xs uppercase tracking-wide bg-white ${getStatusBadge(item.status)}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Details body */}
                            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-extrabold text-slate-800 text-xs tracking-tight line-clamp-1">{item.itemName}</h3>
                                        <span className="shrink-0 px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-650 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                                            {item.code}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-[11px] text-slate-500 font-semibold">
                                        <div className="flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>{item.category}</span>
                                        </div>
                                        {item.foundLocation && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span>Location: {item.foundLocation}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-3.5 border-t border-slate-100">
                                    <button
                                        onClick={() => handleEditClick(item)}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 text-[10px] font-bold rounded-xl border border-slate-200 hover:border-indigo-150 transition-all duration-200"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Edit Details
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDeleteId(item._id);
                                            setShowDeleteModal(true);
                                        }}
                                        className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-100 transition-colors shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal Overlay */}
            {editItem && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl border border-slate-100">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-extrabold uppercase tracking-wider">Edit Item Details</h3>
                                <p className="text-[10px] text-indigo-300 mt-0.5 font-mono">Code: {editItem.code}</p>
                            </div>
                            <button onClick={() => setEditItem(null)} className="text-white hover:text-slate-200 p-1 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Image Preview Block */}
                        {editItem.image?.url && (
                            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-center">
                                <div className="max-h-48 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                                    <img 
                                        src={editItem.image.url} 
                                        alt={editItem.itemName}
                                        className="max-h-48 object-contain"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold text-slate-650">
                            {/* Left Column Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Item Name</label>
                                    <input
                                        type="text"
                                        name="itemName"
                                        value={editItem.itemName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Code</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={editItem.code}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Category</label>
                                    <select
                                        name="category"
                                        value={editItem.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                                    >
                                        <option value="ID Card/Student Card">ID Card/Student Card</option>
                                        <option value="Keys">Keys</option>
                                        <option value="Calculator">Calculator</option>
                                        <option value="Earbuds/Headphones">Earbuds/Headphones</option>
                                        <option value="Water Bottle/Tumbler">Water Bottle/Tumbler</option>
                                        <option value="USB Drive">USB Drive</option>
                                        <option value="Wallet/Purse">Wallet/Purse</option>
                                        <option value="Watch">Watch</option>
                                        <option value="Sunglasses/Eyeglasses">Sunglasses/Eyeglasses</option>
                                        <option value="Stationery">Stationery</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        name="status"
                                        value={editItem.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="verified">Verified</option>
                                        <option value="claimed">Claimed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Right Column Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Found Location</label>
                                    <input
                                        type="text"
                                        name="foundLocation"
                                        value={editItem.foundLocation}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Handover Location</label>
                                    <input
                                        type="text"
                                        name="handoverLocation"
                                        value={editItem.handoverLocation || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Description</label>
                                    <textarea
                                        name="description"
                                        value={editItem.description}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200 h-28 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Claimer Details Section */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-650">
                            <h4 className="font-extrabold text-[10px] text-slate-500 uppercase tracking-widest mb-4">Claimer Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <User className="w-3.5 h-3.5" /> Name
                                    </label>
                                    <input
                                        type="text"
                                        name="claimerDetails.name"
                                        value={editItem.claimerDetails?.name || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                        Roll No
                                    </label>
                                    <input
                                        type="text"
                                        name="claimerDetails.rollNo"
                                        value={editItem.claimerDetails?.rollNo || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Phone className="w-3.5 h-3.5" /> Contact
                                    </label>
                                    <input
                                        type="text"
                                        name="claimerDetails.contact"
                                        value={editItem.claimerDetails?.contact || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-2.5">
                            <button
                                onClick={() => setEditItem(null)}
                                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                            >
                                <Check className="h-4 w-4" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
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
                            
                            <p className="text-rose-650 text-[10px] font-bold text-center">⚠️ Warning: This action cannot be undone.</p>
                            
                            <div className="flex gap-2.5 justify-end pt-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl text-xs font-bold transition-all border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 hover:shadow-lg"
                                >
                                    Delete Record
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditItemPage;
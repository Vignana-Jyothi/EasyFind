import { useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import LostItems from "./LostItems";
import { AlertCircle, CheckCircle, Info, X, Tag, FileText, MapPin, Calendar, HelpCircle } from "lucide-react";

const categories = [
  "ID Card/Student Card",
  "Keys",
  "Calculator",
  "Earbuds/Headphones",
  "Water Bottle/Tumbler",
  "USB Drive",
  "Wallet/Purse",
  "Watch",
  "Sunglasses/Eyeglasses",
  "Stationery",
  "Other"
];

function NotifyLostItems() {
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [itemName, setItemName] = useState("");
  const [dateLost, setDateLost] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const email = user?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!category || !location || !itemName || !dateLost) {
      setMessage({
        type: 'error',
        content: 'Please fill in all required fields.'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/lost`,
        { 
          category, 
          location, 
          email, 
          itemName,
          dateLost,
          description 
        },
        { withCredentials: true }
      );

      setMessage({
        type: 'success',
        content: "Lost report submitted successfully! 🎉 You'll be notified via email immediately if a match is verified."
      });
      
      // Reset form
      setCategory('');
      setLocation('');
      setItemName('');
      setDateLost('');
      setDescription('');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to report item. Please try again.';
      setMessage({
        type: 'error',
        content: errorMsg
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ type: '', content: '' }), 10000);
    }
  };

  const MessageBanner = ({ type, content }) => {
    if (!content) return null;
    
    const icons = {
      success: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      error: <AlertCircle className="w-5 h-5 text-rose-600" />,
      info: <Info className="w-5 h-5 text-blue-600" />
    };

    const styles = {
      success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
      error: 'bg-rose-50 border-rose-300 text-rose-800',
      info: 'bg-blue-50 border-blue-300 text-blue-800'
    };

    return (
      <div className={`${styles[type]} p-4 rounded-2xl border-l-4 mb-6 flex items-start gap-3 animate-fade-in`}>
        <div className="shrink-0">{icons[type]}</div>
        <span className="flex-1 text-xs font-semibold">{content}</span>
        <button 
          onClick={() => setMessage({ type: '', content: '' })}
          className="text-slate-400 hover:text-slate-650 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Report Lost Item</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Create a claim mapping for your lost possessions to help matches verify.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Form Container (Left Column) */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          {message.content && (
            <MessageBanner type={message.type} content={message.content} />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Blue Milton Bottle"
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                  required
                />
              </div>

              {/* Last Known Location */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Last Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Block 2, Canteen"
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                  required
                />
              </div>

              {/* Date Lost */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date Lost <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateLost}
                  onChange={(e) => setDateLost(e.target.value)}
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Item Description */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Item Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the color, brand, distinct details, keychain attached, labels, etc..."
                className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200 h-28 resize-none"
              ></textarea>
              <span className="text-[10px] text-slate-400 mt-1 block">Specify any labels or engraving to help admins verify claims.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-6 text-white font-bold rounded-xl text-xs transition-all duration-200 shadow-md ${
                isSubmitting 
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50 hover:shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Submitting Report...
                </span>
              ) : (
                'Submit Lost Report'
              )}
            </button>
          </form>
        </div>

        {/* Sidebar Info Card (Right Column) */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm border border-slate-900/50 relative overflow-hidden group">
          {/* Background shapes */}
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-550"></div>
          
          <div className="space-y-4">
            <HelpCircle className="w-8 h-8 text-indigo-400" />
            <h3 className="font-extrabold text-sm tracking-tight">How verification works</h3>
            <p className="text-[11px] text-indigo-200 leading-relaxed font-medium">
              After you submit this lost report, the matching module queries verified campus found listings.
            </p>
            <p className="text-[11px] text-indigo-200 leading-relaxed font-medium">
              If an item matches with a confidence score exceeding **50%**, you will receive an automatic email match details notification immediately!
            </p>
          </div>

          <div className="border-t border-white/10 pt-4 text-[10px] text-indigo-300">
            Make sure to check your college email folder for automated matching reports.
          </div>
        </div>
      </div>

      {/* Active Reports List */}
      <div className="pt-4">
        <LostItems />
      </div>
    </div>
  );
}

export default NotifyLostItems;
import React, { useState, useEffect, useCallback } from "react";
import stringSimilarity from "string-similarity"; 
import { useAuth } from "../contexts/AuthContext";
import { Search, Tag, Eye, Info, X, Layers, AlertTriangle } from "lucide-react";

const STOP_WORDS = new Set(["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "him", "his", "how", "i", "if", "in", "into", "is", "it", "its", "me", "more", "most", "my", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "our", "out", "over", "own", "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with", "you", "your", "yours", "yourself", "yourselves"]);

const SYNONYM_MAP = {
  "wallet": "purse",
  "purse": "wallet",
  "mobile": "phone",
  "phone": "mobile",
  "cellphone": "smartphone",
  "smartphone": "cellphone",
  "bag": "backpack",
  "backpack": "bag",
  "keys": "keychain",
  "keychain": "keys",
  "airpods": "earbuds",
  "earbuds": "airpods"
};

const COLORS = ["black", "white", "blue", "red", "green", "yellow", "orange", "pink", "purple", "brown", "grey", "gray", "silver", "gold"];
const BRANDS = ["apple", "samsung", "hp", "dell", "lenovo", "sony", "lg", "mi", "realme", "oneplus", "boat", "noise", "jbl", "nike", "adidas", "puma", "fastrack", "casio", "titan"];

function clientNormalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clientExtractKeywords(text) {
  const normalized = clientNormalize(text);
  if (!normalized) return "";
  return normalized
    .split(" ")
    .filter(w => w && !STOP_WORDS.has(w))
    .map(w => SYNONYM_MAP[w] ? `${w} ${SYNONYM_MAP[w]}` : w)
    .join(" ");
}

function clientExtractColor(text) {
  if (!text) return "";
  const normalized = clientNormalize(text);
  const words = normalized.split(" ");
  return words.find(w => COLORS.includes(w)) || "";
}

function clientExtractBrand(text) {
  if (!text) return "";
  const normalized = clientNormalize(text);
  const words = normalized.split(" ");
  return words.find(w => BRANDS.includes(w)) || "";
}

function computeClientWeightedSimilarity(searchQuery, item) {
  if (!searchQuery) return 1.0;
  
  const queryKeywords = clientExtractKeywords(searchQuery);
  if (!queryKeywords) return 0.0;
  
  const nameKeywords = clientExtractKeywords(item.itemName || "");
  const descKeywords = clientExtractKeywords(item.description || "");
  const catKeywords = clientExtractKeywords(item.category || "");
  const locKeywords = clientExtractKeywords(item.foundLocation || "");
  
  const nameSim = nameKeywords && queryKeywords ? stringSimilarity.compareTwoStrings(queryKeywords, nameKeywords) : 0;
  const descSim = descKeywords && queryKeywords ? stringSimilarity.compareTwoStrings(queryKeywords, descKeywords) : 0;
  const catSim = catKeywords && queryKeywords ? stringSimilarity.compareTwoStrings(queryKeywords, catKeywords) : 0;
  const locSim = locKeywords && queryKeywords ? stringSimilarity.compareTwoStrings(queryKeywords, locKeywords) : 0;
  
  const queryColor = clientExtractColor(searchQuery);
  const itemColor = clientExtractColor((item.itemName || "") + " " + (item.description || ""));
  let colorSim = 1.0;
  if (queryColor && itemColor) {
    colorSim = queryColor === itemColor ? 1.0 : 0.0;
  } else if (queryColor || itemColor) {
    colorSim = 0.5;
  }
  
  const queryBrand = clientExtractBrand(searchQuery);
  const itemBrand = clientExtractBrand((item.itemName || "") + " " + (item.description || ""));
  let brandSim = 1.0;
  if (queryBrand && itemBrand) {
    brandSim = queryBrand === itemBrand ? 1.0 : 0.0;
  } else if (queryBrand || itemBrand) {
    brandSim = 0.5;
  }
  
  const score =
    nameSim * 0.30 +
    descSim * 0.25 +
    catSim * 0.20 +
    locSim * 0.15 +
    colorSim * 0.05 +
    brandSim * 0.05;
    
  return score;
}

const categories = [
  "ID Card/Student Card",
  "Keys",
  "Calculator",
  "Earbuds/Headphones",
  "Mobile / Laptop",
  "Water Bottle/Tumbler",
  "USB Drive",
  "Wallet/Purse",
  "Watch",
  "Sunglasses/Eyeglasses",
  "Other"
];

const SearchItem = () => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("verified");
  const [selectedImage, setSelectedImage] = useState(null);
  const { token } = useAuth();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/found`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        setItems([]);
        setError("");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Search items request failed:", response.status, errorText);
        throw new Error("Failed to fetch items");
      }

      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
      setError("");
    } catch (error) {
      setError("Error fetching items. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = (e) => setSearchQuery(e.target.value);

  const getStatusBadgeClass = (status) => {
    return {
      verified: "bg-emerald-55 border-emerald-100 text-emerald-600",
      claimed: "bg-purple-55 border-purple-100 text-purple-600",
    }[status] || "bg-slate-100 border-slate-200 text-slate-600";
  };

  const filteredItems = items
    .filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesStatus = item.status === activeTab;
      return matchesCategory && matchesStatus;
    })
    .map((item) => ({
      ...item,
      similarity: computeClientWeightedSimilarity(searchQuery, item),
    }))
    .filter((item) => item.similarity > 0.05 || searchQuery.trim() === "")
    .sort((a, b) => b.similarity - a.similarity);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Search Found Items</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Browse through items currently logged and verified at the Security Office.</p>
      </div>

      {/* 2. Privacy & Notice banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl flex gap-3 text-xs leading-relaxed text-amber-800 font-semibold shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Privacy Notice:</strong> Details of the items are hidden for secure owner verification at the security desk. Visit with college ID to claim.
          </p>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-2xl flex gap-3 text-xs leading-relaxed text-blue-800 font-semibold shadow-2xs">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>Collection Details:</strong> All verified items are securely held at the Administration Office / Security Office on campus.
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Text Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
              placeholder="Search items by name, color, description, location..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:w-64">
            <select
              className="w-full px-4 py-3.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab filters */}
        <div className="flex gap-2 border-t border-slate-100 pt-4 overflow-x-auto pb-1">
          {["verified", "claimed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200/50"
              }`}
            >
              {tab === "verified" ? "Verified Items" : "Claimed Items"}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Results Listings */}
      <div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
                <div className="aspect-square bg-slate-100" />
                <div className="p-3.5 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <div 
                key={item._id} 
                onClick={() => setSelectedImage(item)}
                className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer group hover:scale-[1.01]"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-50 shrink-0">
                  {item.image?.url ? (
                    <img
                      src={item.image.url}
                      alt={item.itemName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Layers className="w-8 h-8" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border shadow-2xs uppercase tracking-wide bg-white ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{item.itemName}</h3>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>{item.category || "General"}</span>
                    {item.code && (
                      <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                        {item.code}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-xs">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-xs font-semibold">No {activeTab} found under search criteria.</p>
          </div>
        )}
      </div>

      {/* 5. Image & Details Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold">Item Verification Card</h4>
                <p className="text-[10px] text-indigo-200 font-mono mt-0.5">Code: {selectedImage.code || "N/A"}</p>
              </div>
              <button 
                onClick={() => setSelectedImage(null)}
                className="text-white hover:text-indigo-100 p-1 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {selectedImage.image?.url && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 shadow-2xs">
                  <img src={selectedImage.image.url} alt={selectedImage.itemName} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Item Name</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedImage.itemName}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Category</span>
                    <span className="font-bold text-slate-700 mt-0.5 block">{selectedImage.category || "General"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Status</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] mt-0.5 border ${
                      selectedImage.status === 'claimed'
                        ? 'bg-purple-50 border-purple-100 text-purple-600'
                        : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    }`}>
                      {selectedImage.status ? selectedImage.status.toUpperCase() : 'VERIFIED'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Description</span>
                  <p className="text-slate-650 italic bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 leading-relaxed">
                    "{selectedImage.description || "No description provided."}"
                  </p>
                </div>

                {selectedImage.foundLocation && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Reported Location</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">{selectedImage.foundLocation}</span>
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelectedImage(null)}
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

export default SearchItem;
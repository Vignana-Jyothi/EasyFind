import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  FileText, 
  Tag, 
  MapPin, 
  Calendar, 
  Upload, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Video,
  X
} from "lucide-react";

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

function UploadItem() {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [foundLocation, setFoundLocation] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [reportedDate, setReportedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup image preview
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Camera handling
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
      return () => stopCamera();
    }
  }, [isCameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setErrorMessage("Camera access denied. Please allow camera permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    
    canvas.toBlob(blob => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { 
        type: 'image/jpeg' 
      });
      handleFileChange(file);
      setIsCameraActive(false);
    }, 'image/jpeg', 0.9);
  };

  const handleFileChange = (fileOrEvent) => {
    let file;
    if (fileOrEvent instanceof File) {
      file = fileOrEvent;
    } else {
      file = fileOrEvent.target.files[0];
    }
    
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image too large (max 5MB)");
      return;
    }

    setErrorMessage("");
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setErrorMessage("");
    setIsSuccess(false);

    const currentDate = new Date().toISOString().split('T')[0];
    if (reportedDate > currentDate) {
      setErrorMessage("Date Found cannot be in the future");
      return;
    }

    const requiredFields = [
      !itemName && "Item Name",
      !category && "Category",
      !foundLocation && "Found Location",
      !image && "Image",
      !reportedDate && "Date Found"
    ].filter(Boolean);

    if (requiredFields.length > 0) {
      setErrorMessage(`Missing: ${requiredFields.join(", ")}`);
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("itemName", itemName);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("foundLocation", foundLocation);
    formData.append("image", image);
    formData.append("reportedDate", reportedDate);

    try {
      await axios.post(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setIsSuccess(true);
      setItemName("");
      setCategory("");
      setFoundLocation("");
      setDescription("");
      setImage(null);
      setImagePreview(null);
      setReportedDate("");
      setFileInputKey(Date.now());
    } catch (error) {
      let errorMsg = "Submission failed. Please try again.";
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Upload Found Item</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Log newly recovered items into the database to initiate AI similarity matches.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Main Upload Form (Left Columns) */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          {isSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-l-4 border-emerald-400 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              Item uploaded successfully!
            </div>
          )}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border-l-4 border-rose-400 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              Error: {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Item Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Black Dell Charger"
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>

              {/* Found Location */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Found Location *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block 1 Seminar Hall"
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                  value={foundLocation}
                  onChange={(e) => setFoundLocation(e.target.value)}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Category *
                </label>
                <select
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Date Found */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date Found *
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                  value={reportedDate}
                  onChange={(e) => setReportedDate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Description</label>
              <textarea
                placeholder="Mention identification traits (colors, scratches, stickers, brand name)..."
                className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200 h-28 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Photo Section */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Item Image *</label>
              <div className="flex flex-wrap gap-2.5">
                <label className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer text-xs font-bold transition-all duration-200 shadow-2xs">
                  <Upload className="w-4 h-4 text-slate-500" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    key={fileInputKey}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setIsCameraActive(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all duration-200"
                >
                  <Camera className="w-4 h-4 text-indigo-500" />
                  Use Camera
                </button>
              </div>

              {imagePreview && (
                <div className="relative inline-block mt-2 border border-slate-150 rounded-2xl overflow-hidden shadow-2xs">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-28 w-28 object-cover cursor-pointer"
                    onClick={() => setEnlargedImage(imagePreview)}
                  />
                  <span className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 text-[8px] font-bold text-white rounded">Preview</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 text-white font-bold rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading Item...
                </span>
              ) : (
                "Upload Item"
              )}
            </button>
          </form>
        </div>

        {/* Info card (Right Column) */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm border border-slate-900/50 relative overflow-hidden group">
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-550"></div>
          
          <div className="space-y-4">
            <HelpCircle className="w-8 h-8 text-indigo-400" />
            <h3 className="font-extrabold text-sm tracking-tight font-sans">Item Recovery guidelines</h3>
            <ol className="list-decimal ml-4 text-[11px] text-indigo-200 space-y-2.5 font-semibold leading-relaxed">
              <li>Upload a clear photo of the found item.</li>
              <li>Provide descriptive metadata including unique markings.</li>
              <li>Mark the accurate location where item was recovered.</li>
              <li>The system generates a unique 4-letter alphanumeric item code for barcode claim matching.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-950 rounded-3xl overflow-hidden max-w-lg w-full border border-slate-800 shadow-2xl p-5 flex flex-col items-center gap-4">
            <div className="flex justify-between items-center w-full pb-2 border-b border-slate-800">
              <span className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-400" />
                Recovered Item Camera Capture
              </span>
              <button 
                onClick={() => setIsCameraActive(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black relative border border-slate-850">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-3 justify-end w-full pt-2">
              <button 
                onClick={captureImage} 
                className="bg-white hover:bg-slate-50 text-slate-900 px-5 py-2 rounded-xl text-xs font-extrabold shadow-sm transition duration-200"
              >
                Capture Photo
              </button>
              <button 
                onClick={() => setIsCameraActive(false)} 
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-extrabold transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex justify-center items-center">
            <button 
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-200"
            >
              <X className="w-7 h-7" />
            </button>
            <img
              src={enlargedImage}
              alt="Enlarged Preview"
              className="max-w-full max-h-full object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadItem;
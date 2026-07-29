import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Tag, 
  MapPin, 
  Calendar, 
  FileText, 
  Camera, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Video
} from 'lucide-react';

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

const ReportItem = ({ onItemReported }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    foundLocation: '',
    category: '',
    reportedDate: ''
  });
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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
      setStatus("Camera access denied. Please check permissions.");
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
      handleImageChange(file);
      setIsCameraActive(false);
    }, 'image/jpeg', 0.9);
  };

  const handleImageChange = (fileOrEvent) => {
    let file;
    if (fileOrEvent instanceof File) {
      file = fileOrEvent;
    } else {
      file = fileOrEvent.target.files[0];
    }
    
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus("Image too large (max 5MB)");
      return;
    }

    setStatus('');
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setFormData({ itemName: '', description: '', foundLocation: '', category: '', reportedDate: '' });
    setImage(null);
    setImagePreview(null);
    setStatus('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    if (!image) {
      setStatus('Please upload or capture an image of the found item.');
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    if (formData.reportedDate > currentDate) {
      setStatus("Date Found cannot be in the future");
      return;
    }

    setLoading(true);
    try {
      const index = user.email?.indexOf('@');
      const rollNo = user.email.substring(0, index);
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      data.append('reporterRollNo', rollNo);
      data.append('image', image);

      const response = await axios.post(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/found`, data, {
          withCredentials: true,
        }
      );

      const res = response.data;
      if (res.success) {
        resetForm();
        setSuccessMessage('Item successfully reported! Please hand over the physical item to the security office as soon as possible.');
        setTimeout(() => {
          setSuccessMessage('');
          onItemReported?.(res.item);
          navigate('/dashboard');
        }, 8000);
      } else {
        throw new Error(res.message || 'Failed to report item');
      }
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to report item';
      setStatus(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Report Found Item</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Add details of items you've found on campus to help reunite them with owners.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Main Form (Left Column) */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          {status && (
            <div className="p-4 rounded-2xl bg-rose-50 border-l-4 border-rose-400 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              {status}
            </div>
          )}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-l-4 border-emerald-400 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Item Name *
                </label>
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  placeholder="e.g., Boat Earphones, Milton Bottle"
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                  required
                />
              </div>

              {/* Found Location */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Found Location *
                </label>
                <input
                  type="text"
                  name="foundLocation"
                  value={formData.foundLocation}
                  onChange={handleChange}
                  placeholder="e.g., Canteen, Block 2 Room 102"
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date Found *
                </label>
                <input
                  type="date"
                  name="reportedDate"
                  value={formData.reportedDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mention unique features (colors, keychains, physical damages, brand name)..."
                rows={3}
                className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200 h-28 resize-none"
                required
              />
            </div>

            {/* Media Upload Options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Attach Item Image *
              </label>
              <div className="flex flex-wrap gap-2.5">
                <label className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer text-xs font-bold transition-all duration-200 shadow-2xs">
                  <Upload className="w-4 h-4 text-slate-500" />
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => { setStatus(''); setIsCameraActive(true); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all duration-200"
                >
                  <Camera className="w-4 h-4 text-indigo-500" />
                  Take Live Photo
                </button>
              </div>

              {imagePreview && (
                <div className="relative inline-block mt-2 border border-slate-150 rounded-2xl overflow-hidden shadow-2xs">
                  <img src={imagePreview} alt="Preview" className="h-28 w-28 object-cover" />
                  <button 
                    type="button" 
                    onClick={() => { setImage(null); setImagePreview(null); }}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-1 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-6 text-white font-bold rounded-xl text-xs transition-all duration-200 shadow-md ${
                loading 
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50 hover:shadow-lg'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Submitting Report...
                </span>
              ) : (
                'Report Found Item'
              )}
            </button>
          </form>
        </div>

        {/* Sidebar Info Card (Right Column) */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm border border-slate-900/50 relative overflow-hidden group">
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-550"></div>
          
          <div className="space-y-4">
            <HelpCircle className="w-8 h-8 text-indigo-400" />
            <h3 className="font-extrabold text-sm tracking-tight">Next steps</h3>
            <ol className="list-decimal ml-4 text-[11px] text-indigo-200 space-y-2.5 font-semibold">
              <li>Submit this found report with image details.</li>
              <li>Deliver the physical found item to the security desk.</li>
              <li>We automatically run weighted similarity matching.</li>
              <li>If matches exceed the threshold, notifications trigger.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Webcam overlay */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-950 rounded-3xl overflow-hidden max-w-lg w-full border border-slate-800 shadow-2xl p-5 flex flex-col items-center gap-4">
            <div className="flex justify-between items-center w-full pb-2 border-b border-slate-800">
              <span className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-400" />
                Live Camera Capture
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
    </div>
  );
};

export default ReportItem;
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ClaimedItemDetails from "./ClaimedItemDetails";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

function GiveToStudent() {
  const [items, setItems] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState(null);
  const [contact, setContact] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [handoverDate, setHandoverDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("verified");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [backendError, setBackendError] = useState("");
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Barcode / Secure Handover States
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [manualRollNoInput, setManualRollNoInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");
  
  const html5QrcodeRef = useRef(null);

  const handleOpenSecureModal = (item) => {
    setSelectedItem(item);
    setIsBarcodeModalOpen(true);
    setVerifiedStudent(null);
    setVerificationSuccess(false);
    setScanError("");
    setBarcodeValue("");
    setManualRollNoInput("");
    setContact("");
  };

  const handleCloseSecureModal = async () => {
    await stopScanning();
    setIsBarcodeModalOpen(false);
    setSelectedItem(null);
    setVerifiedStudent(null);
    setVerificationSuccess(false);
    setScanError("");
    setBarcodeValue("");
    setManualRollNoInput("");
    setContact("");
  };

  const startScanning = async () => {
    setScanError("");
    setScanLoading(true);
    try {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        await html5QrcodeRef.current.stop();
      }

      // Initialize Html5Qrcode with all barcode formats supported
      const html5Qrcode = new Html5Qrcode("reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF
        ],
        verbose: false
      });
      html5QrcodeRef.current = html5Qrcode;

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error("No camera found on this device.");
      }

      // Optimized layout configuration for long, thin 1D barcodes
      const config = {
        fps: 15,
        qrbox: (width, height) => {
          const boxWidth = Math.min(width * 0.85, 320);
          const boxHeight = Math.min(height * 0.35, 110);
          return { width: boxWidth, height: boxHeight };
        },
        aspectRatio: 1.777778,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await html5Qrcode.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          console.log(`[Barcode Scanned] Text: ${decodedText}`);
          setBarcodeValue(decodedText);
          try {
            await html5Qrcode.stop();
          } catch (stopErr) {
            console.error("Error stopping scanner after detection:", stopErr);
          }
          setIsScanning(false);
          await verifyOwnership(decodedText, "");
        },
        (errorMessage) => {
          // Frame scanner warnings, safe to ignore
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Camera access/start error:", err);
      setScanError(err.message || "Camera access denied or unavailable.");
      setIsScanning(false);
    } finally {
      setScanLoading(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const verifyOwnership = async (scannedBarcode, enteredRollNo) => {
    setIsVerifying(true);
    setScanError("");
    setVerifiedStudent(null);
    setVerificationSuccess(false);

    const targetRoll = (scannedBarcode || enteredRollNo || "").trim().toLowerCase();
    if (!targetRoll) {
      setScanError("Please enter a valid roll number or scan a barcode");
      setIsVerifying(false);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/${selectedItem._id}/verify-handover`,
        {
          barcodeValue: scannedBarcode || "",
          rollNo: enteredRollNo || ""
        },
        { withCredentials: true }
      );

      if (response.data?.success) {
        setVerifiedStudent(response.data);
        setVerificationSuccess(true);
      } else {
        setScanError(response.data?.message || "Verification failed");
      }
    } catch (err) {
      console.error("Verification API Error:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Verification failed. Student does not have a matching lost item report above threshold.";
      setScanError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmSecureHandover = async () => {
    if (!selectedItem || !verifiedStudent) return;
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/${selectedItem._id}/confirm-handover`,
        {
          barcodeValue: barcodeValue || "",
          rollNo: verifiedStudent.student.rollNo,
          name: verifiedStudent.student.name,
          contact: contact || "N/A",
          isManual: !barcodeValue
        },
        { withCredentials: true }
      );

      if (response.data?.success) {
        // Move item to claimed locally
        setItems(items.map(item => 
          item._id === selectedItem._id ? { 
            ...item, 
            status: "claimed", 
            handoverDetails: response.data.item.handoverDetails,
            claimerDetails: response.data.item.claimerDetails
          } : item
        ));
        
        setIsSuccess(true);
        setIsBarcodeModalOpen(false);
        setSelectedItem(null);
        setVerifiedStudent(null);
        setVerificationSuccess(false);
        setScanError("");
        setBarcodeValue("");
        setManualRollNoInput("");
        setContact("");
      } else {
        setScanError(response.data?.message || "Handover confirmation failed");
      }
    } catch (err) {
      console.error("Confirm Secure Handover API Error:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to confirm handover.";
      setScanError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/found`, {
          withCredentials: true,
        });

        if (Array.isArray(response.data)) {
          setItems(response.data);
        } else {
          console.warn("Unexpected items payload:", response.data);
          setItems([]);
          setBackendError("Failed to load items: unexpected response from server.");
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        const message = error.response?.data?.message || error.response?.data?.error || "Failed to load items. Please try again later.";
        setBackendError(message);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    if (enlargedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [enlargedImage]);

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isCameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setErrorMessage("Camera access denied. Please allow camera permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(blob => {
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      handleFileChange({ target: { files: [file] } });
      setIsCameraActive(false);
    }, 'image/jpeg', 0.9);
  };

  const validatePhoneNumber = (number) => /^\d{10}$/.test(number);
  const validateFile = (file) => file && file.size <= 5 * 1024 * 1024;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      setErrorMessage("File size too large (max 5MB)");
      return;
    }

    setProofImage(file);
    setProofImagePreview(URL.createObjectURL(file));
    setIsCameraActive(false);
  };

  const handleSubmitProofs = async () => {
    setErrorMessage("");
    setBackendError("");

    if (!selectedItem || !proofImage || !contact || !rollNo || !name || !handoverDate) {
      setErrorMessage("Please fill all details and upload a proof image.");
      return;
    }

    if (!validatePhoneNumber(contact)) {
      setErrorMessage("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", proofImage);
    formData.append("contact", contact);
    formData.append("rollNo", rollNo);
    formData.append("name", name);
    formData.append("dateHandovered", new Date(handoverDate).toISOString());

    try {
    const response = await axios.put(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/${selectedItem._id}/handover`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
      withCredentials: true,
        }
      );

      setItems(items.map(item => 
        item._id === selectedItem._id ? { 
          ...item, 
          status: "claimed", 
          claimerDetails: { 
            contact, 
            rollNo, 
            name, 
            dateHandovered: new Date(handoverDate).toISOString() 
          } 
        } : item
      ));

      setSelectedItem(null);
      setProofImage(null);
      setProofImagePreview(null);
      setContact("");
      setRollNo("");
      setName("");
      setHandoverDate("");
      setIsSuccess(true);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "An unexpected error occurred";
      setBackendError(errorMsg);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsSuccess(false);
        setBackendError("");
      }, 5000);
    }
  };

  const toggleHandoverForm = (item) => {
    setSelectedItem(prev => prev?._id === item._id ? null : item);
    setErrorMessage("");
    setBackendError("");
    setName("");
    setRollNo("");
    setContact("");
    setHandoverDate("");
    setProofImage(null);
    setProofImagePreview(null);
  };

  const toggleItemDetails = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredItems = Array.isArray(items)
    ? items
        .filter(item =>
          (searchCode ? item.code.includes(searchCode) : true) &&
          (searchCategory ? item.category.toLowerCase().includes(searchCategory.toLowerCase()) : true) &&
          item.status === filterStatus
        )
        .sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate))
    : [];

  const LoadingSpinner = () => (
    <span className="flex items-center justify-center">
      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Processing...
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Give To Student</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Coordinate physical collections and verify student barcode ownership claims.</p>
      </div>

      {isSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-l-4 border-emerald-400 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          ✅ Handover successful!
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 border-l-4 border-amber-400 text-amber-800 text-xs font-semibold flex items-center gap-2">
          ⚠️ {errorMessage}
        </div>
      )}
      {backendError && (
        <div className="p-4 rounded-2xl bg-rose-50 border-l-4 border-rose-400 text-rose-800 text-xs font-semibold flex items-center gap-2">
          ❌ Error: {backendError}
        </div>
      )}

      {/* Filter and Search Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Code Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by Item Code..."
              className="w-full px-4 py-3.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
              onChange={(e) => setSearchCode(e.target.value)}
            />
          </div>
          {/* Category Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by Category..."
              className="w-full px-4 py-3.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
              onChange={(e) => setSearchCategory(e.target.value)}
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 border-t border-slate-100 pt-4">
          {["verified", "claimed"].map((status) => (
            <button
              key={status}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 capitalize ${
                filterStatus === status
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200/50"
              }`}
              onClick={() => setFilterStatus(status)}
            >
              {status} Items
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-4">
        {filteredItems.map(item => (
          <li key={item._id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 group hover:scale-[1.005]">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                    item.status === 'verified' ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'
                  }`}></span>
                  <h3 className="font-extrabold text-slate-800 text-sm">{item.itemName}</h3>
                  <span className="text-[10px] text-indigo-650 bg-indigo-50 font-bold px-1.5 py-0.5 rounded font-mono">Code: {item.code}</span>
                  {item.image?.url && (
                    <img 
                      src={item.image.url} 
                      alt="Item" 
                      className="w-10 h-10 object-cover rounded-lg border border-slate-150 cursor-pointer hover:opacity-85 transition-opacity"
                      onClick={() => setEnlargedImage(item.image.url)}
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
                  <div>
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Category</label>
                    <p className="font-extrabold text-slate-700 mt-1">{item.category}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Status</label>
                    <p className="capitalize font-extrabold text-slate-700 mt-1">{item.status}</p>
                  </div>
                  
                  {(item.status === "claimed" || expandedItems[item._id]) && (
                    <>
                      <div>
                        <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Reported Date</label>
                        <p className="font-bold text-slate-700 mt-1">{formatDate(item.reportedDate)}</p>
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Found Location</label>
                        <p className="capitalize font-bold text-slate-700 mt-1">{item.foundLocation}</p>
                      </div>
                    </>
                  )}
                  
                  {item.status === "claimed" && (
                    <div>
                      <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Handover Date</label>
                      <p className="font-bold text-slate-700 mt-1">{formatDate(item.claimerDetails?.dateHandovered)}</p>
                    </div>
                  )}
                </div>
                
                {item.status === "verified" && (
                  <div className="mt-3">
                    {!expandedItems[item._id] ? (
                      <button
                        onClick={() => toggleItemDetails(item._id)}
                        className="text-indigo-600 hover:text-indigo-700 text-xs font-bold"
                      >
                        View Details
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleItemDetails(item._id)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        Hide Details
                      </button>
                    )}
                  </div>
                )}
                
                {item.status === "claimed" && <ClaimedItemDetails item={item} />}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 ml-4 shrink-0">
                {item.status === "verified" && (
                  <>
                    <button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-sm"
                      onClick={() => toggleHandoverForm(item)}
                    >
                      {selectedItem?._id === item._id && !isBarcodeModalOpen ? "Close Details" : "Proof Handover"}
                    </button>
                    <button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100 hover:shadow-lg"
                      onClick={() => handleOpenSecureModal(item)}
                    >
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h16M4 16h16" />
                      </svg>
                      Secure Handover
                    </button>
                  </>
                )}
              </div>
            </div>

            {selectedItem?._id === item._id && (
              <div className="mt-5 pt-5 border-t border-slate-100/80 space-y-4 animate-fade-in">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Handover Form Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Student Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Roll Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Contact Number</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Handover Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                      value={handoverDate}
                      onChange={(e) => setHandoverDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Handover Proof Image</label>
                  <div className="flex flex-wrap gap-2.5">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer text-xs font-bold transition-all duration-200 shadow-2xs">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Choose Proof File
                    </label>
                    
                    <button
                      onClick={() => setIsCameraActive(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-xl text-xs font-bold transition-all duration-200"
                    >
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Use Camera
                    </button>
                  </div>
                  {proofImagePreview && (
                    <div className="relative inline-block mt-2 border border-slate-150 rounded-2xl overflow-hidden shadow-2xs">
                      <img
                        src={proofImagePreview}
                        alt="Proof preview"
                        className="h-28 w-28 object-cover cursor-pointer"
                        onClick={() => setEnlargedImage(proofImagePreview)}
                      />
                      <span className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 text-[8px] font-bold text-white rounded">Preview</span>
                    </div>
                  )}
                </div>

                <button
                  className="w-full py-3.5 px-6 text-white font-bold rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmitProofs}
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner /> : "Confirm Handover"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img 
              src={enlargedImage} 
              alt="Enlarged preview" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              className="absolute -top-8 right-0 text-white hover:text-gray-200 transition-colors"
              onClick={() => setEnlargedImage(null)}
              aria-label="Close enlarged view"
            >
              <svg 
                className="w-8 h-8"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Secure Handover / Barcode Scanner Modal */}
      {isBarcodeModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-8 border border-slate-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Secure Barcode Handover</h3>
                <p className="text-[10px] text-indigo-300 mt-0.5 font-mono">Item: {selectedItem?.itemName} (Code: {selectedItem?.code})</p>
              </div>
              <button 
                onClick={handleCloseSecureModal}
                className="text-white hover:text-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Scan Error Alerts */}
              {scanError && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl text-xs font-semibold text-rose-805 flex items-start gap-2.5">
                  <svg className="h-5 w-5 text-rose-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-extrabold text-rose-800">Verification Rejected</span>
                    <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">{scanError}</p>
                  </div>
                </div>
              )}

              {/* Status 1: Scan / Input Phase */}
              {!verificationSuccess && (
                <div className="space-y-5">
                  {/* Camera Preview Container */}
                  <div className="relative border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 aspect-video flex flex-col items-center justify-center">
                    <div id="reader" className="w-full h-full object-cover"></div>
                    
                    {!isScanning && !scanLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <svg className="w-10 h-10 mb-2 text-slate-650" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h16M4 16h16" />
                        </svg>
                        <p className="text-xs font-bold text-white">Scanner is inactive</p>
                        <p className="text-[10px] text-slate-500 mt-1">Activate camera to verify college ID barcode</p>
                      </div>
                    )}

                    {scanLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white">
                        <svg className="animate-spin h-7 w-7 text-indigo-500 mb-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-[10px] font-bold text-slate-400">Initializing Camera Module...</p>
                      </div>
                    )}
                  </div>

                  {/* Scanner Action Buttons */}
                  <div className="flex gap-2.5 justify-center">
                    {!isScanning ? (
                      <button
                        onClick={startScanning}
                        disabled={scanLoading}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Start Scanner
                      </button>
                    ) : (
                      <button
                        onClick={stopScanning}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Stop Scanner
                      </button>
                    )}
                    <button
                      onClick={startScanning}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200/65"
                    >
                      Retry
                    </button>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-150"></div>
                    <span className="flex-shrink mx-3 text-slate-405 text-[9px] uppercase font-black tracking-wider">OR</span>
                    <div className="flex-grow border-t border-slate-150"></div>
                  </div>

                  {/* Manual Entry Form */}
                  <div className="bg-slate-50/50 p-4.5 rounded-2xl border border-slate-150">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Manual Roll Number Entry</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 23071A0504"
                        className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-250 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white uppercase transition-all duration-200"
                        value={manualRollNoInput}
                        onChange={(e) => setManualRollNoInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && verifyOwnership("", manualRollNoInput)}
                      />
                      <button
                        onClick={() => verifyOwnership("", manualRollNoInput)}
                        disabled={isVerifying}
                        className="bg-indigo-650 hover:bg-indigo-750 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shrink-0"
                      >
                        {isVerifying ? "Verifying..." : "Verify ID"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status 2: Verification Success Card */}
              {verificationSuccess && verifiedStudent && (
                <div className="space-y-5">
                  {/* Verification Success Header Card */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4.5 animate-fade-in text-emerald-800">
                    <div className="bg-emerald-500 text-white p-2 rounded-full flex-shrink-0 shadow-2xs">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold">Verification Success!</h4>
                      <p className="text-[11px] text-emerald-700 mt-1 font-semibold leading-relaxed">The student is verified as the rightful owner of the lost item report.</p>
                    </div>
                  </div>

                  {/* Owner and Lost Item details comparison card */}
                  <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-2xs text-xs font-semibold">
                    {/* Student Info Section */}
                    <div className="bg-slate-50/75 border-b border-slate-150 px-4 py-3">
                      <h5 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">Student Details</h5>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4 text-slate-700">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Roll Number</span>
                        <span className="font-extrabold text-slate-800 mt-1 block">{verifiedStudent.student.rollNo}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Student Name</span>
                        <span className="font-extrabold text-slate-800 mt-1 block">{verifiedStudent.student.name}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Email Address</span>
                        <span className="font-semibold text-slate-800 mt-1 block truncate">{verifiedStudent.student.email}</span>
                      </div>
                    </div>

                    {/* Matched Lost Report Section */}
                    <div className="bg-slate-50/75 border-t border-b border-slate-150 px-4 py-3">
                      <h5 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">Matched Lost Item Report</h5>
                    </div>
                    <div className="p-4 space-y-3 text-slate-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Lost Item Name</span>
                          <span className="font-extrabold text-slate-800 mt-1 block">{verifiedStudent.matchedItem.itemName}</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-650 border border-indigo-100 text-[9px] font-black rounded-full shrink-0">
                          {verifiedStudent.matchedItem.score}% Match Score
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Category</span>
                        <span className="font-semibold text-slate-800 mt-1 block">{verifiedStudent.matchedItem.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Description</span>
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">
                          "{verifiedStudent.matchedItem.description}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Handover Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Number (Optional)</label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleConfirmSecureHandover}
                      disabled={isLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-4.5 w-4.5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Confirm Handover
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setVerifiedStudent(null);
                        setVerificationSuccess(false);
                        setScanError("");
                        setBarcodeValue("");
                        setManualRollNoInput("");
                      }}
                      className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors border border-slate-200"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GiveToStudent;
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const { loginWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: "", message: "" });

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  const handleSuccess = async (credentialResponse) => {
    try {
      setError("");
      console.log("✅ ID Token:", credentialResponse.credential);

      // Call login function from context
      await loginWithGoogle(credentialResponse.credential);

      // Navigate to protected route after login
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Login error:", error);
      
      let title = "Login Failed";
      let message = "Authentication failed. Please try again.";

      if (error.status === 403) {
        title = "Access Denied";
        message = "EasyFind can only be accessed using an official VNR VJIET Google account. Please sign in using your college email address.";
      } else if (error.status === 401) {
        title = "Authentication Failed";
        message = "Authentication failed. Please try again.";
      } else if (error.status === 500) {
        title = "Server Error";
        message = "Server error. Please try again later.";
      } else if (error.message && (error.message.includes("fetch") || error.message.includes("Network Error") || error.message.includes("Failed to fetch"))) {
        title = "Network Error";
        message = "Unable to connect to the server. Please check your network connection.";
      } else if (error.message && (error.message.includes("timeout") || error.message.includes("Timeout"))) {
        title = "Timeout";
        message = "Request timed out. Please try again.";
      } else if (error.message) {
        message = error.message;
      }

      setErrorModal({
        isOpen: true,
        title,
        message
      });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      padding: 24
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
        padding: 24
      }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
            Sign in to EasyFind
          </h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              console.error('❌ Login Failed');
              setErrorModal({
                isOpen: true,
                title: "Google Sign-In Failed",
                message: "Google Sign-In failed. Please try again."
              });
            }}
          />
        </div>

        {error && (
          <div style={{
            marginTop: 8,
            padding: '10px 12px',
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 8,
            fontSize: 14,
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </div>

      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 space-y-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100 shrink-0">
                <span className="text-2xl" role="img" aria-label="Access Denied">🚫</span>
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg leading-tight mt-1">{errorModal.title}</h3>
            </div>
            
            <p className="text-slate-650 text-xs font-semibold leading-relaxed px-2">
              {errorModal.message}
            </p>

            <button
              onClick={() => setErrorModal({ isOpen: false, title: "", message: "" })}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl text-xs transition duration-200 cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleLoginButton;


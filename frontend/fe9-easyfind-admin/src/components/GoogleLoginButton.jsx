import React, { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; 

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const BE_URL = import.meta.env.VITE_EASYFIND_BACKEND_URL;

const allowedEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];
console.log("allowed mails",allowedEmails)

const WrappedGoogleLoginButton = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const handleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      // Use the correctly imported function
      const decoded = jwtDecode(idToken);
      const email = decoded?.email;

      console.log("✅ Google ID Token received for:", email);

      if (!email || !allowedEmails.includes(email)) {
        const msg = `❌ Access denied: ${email} is not an authorized admin email.`;
        console.warn(msg);
        setMessage(msg);
        return;
      }

      // Go through be9 so admin check can be enforced server-side
      const res = await fetch(`${BE_URL}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token: idToken }),
      });

      if (!res.ok) throw new Error("Login failed");
      // Cookie is set by auth server via be9 proxy; no localStorage
      navigate('/admin');
    } catch (error) {
      const msg = `❌ Login failed: ${error?.response?.data || error.message}`;
      console.error(msg);
      setMessage(msg);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div style={{ textAlign: 'center' }}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setMessage("❌ Google Login Failed")}
        />
        {message && (
          <p style={{ marginTop: '1rem', color: 'red', fontWeight: 'bold' }}>
            {message}
          </p>
        )}
      </div>
    </GoogleOAuthProvider>
  );
};

export default WrappedGoogleLoginButton;
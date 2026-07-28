import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

// Use be9 backend for admin auth check (cookie-based)
const BE_URL = import.meta.env.VITE_EASYFIND_BACKEND_URL;

const ProtectedRoute = ({ children }) => {
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Server-side check: Verify session via HttpOnly cookie on be9
  const res = await fetch(`${BE_URL}/auth/admin/check-auth`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        
        const data = await res.json();
        console.log("at the admin protected route res",res,data);
        if (res.ok) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }

      } catch (error) {
        console.error("❌ Admin auth check failed:", error.message);
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Run only once on component mount

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return isValid ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
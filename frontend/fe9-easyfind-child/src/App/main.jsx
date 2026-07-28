import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = "522460567146-ubk3ojomopil8f68hl73jt1pj0jbbm68.apps.googleusercontent.com"
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <React.StrictMode>
     <GoogleOAuthProvider clientId={clientId}>
    <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

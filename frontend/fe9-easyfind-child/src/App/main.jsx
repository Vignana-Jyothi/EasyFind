import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = "99061194438-8n8t6moc8n7aj5l1l12435ju9kj2rqjq.apps.googleusercontent.com"
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <React.StrictMode>
     <GoogleOAuthProvider clientId={clientId}>
    <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

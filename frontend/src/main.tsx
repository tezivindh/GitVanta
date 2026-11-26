import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// GitVanta is dark only now; forget the old light/dark preference.
try {
  localStorage.removeItem('theme-storage');
} catch {
  /* storage unavailable: nothing to clean */
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

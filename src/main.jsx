import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

window.addEventListener('contextmenu', (e) => e.preventDefault(), { capture: true });
window.addEventListener(
  'keydown',
  (e) => {
    const key = e.key?.toLowerCase();
    if (
      key === 'f12' ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
      ((e.ctrlKey || e.metaKey) && ['u', 's'].includes(key))
    ) {
      e.preventDefault();
    }
  },
  { capture: true }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

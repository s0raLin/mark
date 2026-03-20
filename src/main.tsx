import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Restore persisted accent color before first paint
const savedAccent = localStorage.getItem("studiomark_accent_color");
if (savedAccent) {
  document.documentElement.style.setProperty("--color-primary", savedAccent);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

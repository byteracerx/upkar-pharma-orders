
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Error handling
const handleError = (error: any) => {
  console.error("Global error caught:", error);
};

// Add global error handler
window.addEventListener('error', (event) => {
  handleError(event.error);
});

// Add promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  handleError(event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);

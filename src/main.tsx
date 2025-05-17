
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Enhanced error handling
const handleError = (error: any) => {
  console.error("Global error caught:", error);
  
  // Log additional details if available
  if (error.stack) {
    console.error("Stack trace:", error.stack);
  }
  
  // You can add additional error reporting here
  // e.g., send to an error tracking service
};

// Add global error handler
window.addEventListener('error', (event) => {
  handleError(event.error);
});

// Add promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  handleError(event.reason);
});

<<<<<<< HEAD
// Get the root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found");
} else {
  // Create root and render app
  const root = createRoot(rootElement);
  root.render(<App />);
=======
// Create root and render app with error boundary
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found");
>>>>>>> df8fe6b2da43d6f64f1ade5aefe2f621d3e217fe
}

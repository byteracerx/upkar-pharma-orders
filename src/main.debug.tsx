import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Enhanced error handling
const handleError = (error: any) => {
  console.error("Global error caught:", error);
  
  // Display error on screen for debugging
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.right = '0';
  errorDiv.style.padding = '20px';
  errorDiv.style.backgroundColor = 'red';
  errorDiv.style.color = 'white';
  errorDiv.style.zIndex = '9999';
  errorDiv.textContent = `Error: ${error?.message || 'Unknown error'}`;
  document.body.appendChild(errorDiv);
};

// Add global error handler
window.addEventListener('error', (event) => {
  handleError(event.error);
});

// Add promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  handleError(event.reason);
});

// Try to render the app with error boundary
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  console.log("Starting to render app...");
  createRoot(rootElement).render(<App />);
  console.log("App rendered successfully");
} catch (error) {
  console.error("Failed to render app:", error);
  handleError(error);
  
  // Create a fallback UI
  const rootElement = document.getElementById("root") || document.body;
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1 style="color: red;">Application Error</h1>
      <p>The application failed to load. Please check the console for more details.</p>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px;">${error?.stack || error?.message || 'Unknown error'}</pre>
    </div>
  `;
}

import { toast as sonnerToast } from "sonner";
import { type ToasterProps } from "sonner"; // Changed from ToastProps to ToasterProps

export type ToastProps = ToasterProps;

// Re-export the sonner toast for convenience
export const toast = sonnerToast;

// Export useToast hook that returns the toast function
export function useToast() {
  return {
    toast: sonnerToast
  };
}

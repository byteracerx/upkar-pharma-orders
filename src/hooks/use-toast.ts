
import { toast as sonnerToast } from "sonner";

// Export the sonner toast directly for consistent usage
export const toast = sonnerToast;

// Export useToast hook that returns the toast function
export function useToast() {
  return {
    toast: sonnerToast
  };
}

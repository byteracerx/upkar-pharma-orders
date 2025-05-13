
import { toast as sonnerToast } from "sonner";
import { type ToastProps as SonnerToastProps } from "sonner";

export type ToastProps = SonnerToastProps;

// Re-export the sonner toast for convenience
export const toast = sonnerToast;

// Export useToast hook that returns the toast function
export function useToast() {
  return {
    toast: sonnerToast
  };
}

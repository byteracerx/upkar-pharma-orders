// Re-export from sonner directly for simplicity and consistency
import { toast } from "sonner";
import { useToast as useShadcnToast } from "@/hooks/use-toast";

// Keep the useToast hook for backward compatibility
export { useShadcnToast as useToast, toast };

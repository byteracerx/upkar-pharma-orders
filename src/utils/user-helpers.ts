
import { User } from "@/types/auth";

/**
 * Safely gets a display name from user object
 * Falls back to email or a default value if name is not available
 */
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return "Guest";
  
  // Return name if available
  if (user.name) return user.name;
  
  // Fall back to email (before @ symbol) if name is not available
  if (user.email) {
    const emailName = user.email.split('@')[0];
    // Capitalize first letter
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  
  // Final fallback
  return "User";
};

/**
 * Format user name for display in components
 * Can be used for formatting with additional requirements
 */
export const formatUserName = (name: string | undefined | null): string => {
  if (!name) return "Unknown";
  return name;
};


import { User } from '@supabase/supabase-js';

export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'User';
  
  // Try to get name from user metadata first
  if (user.user_metadata?.name) {
    return user.user_metadata.name;
  }
  
  // Fallback to email prefix
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'User';
};

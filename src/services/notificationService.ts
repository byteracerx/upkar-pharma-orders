
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: any;
  created_at: string;
  updated_at: string;
}

export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    toast.error('Failed to load notifications');
    return [];
  }
};

export const getUnreadCount = async (): Promise<number> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return 0;

    const { data, error } = await supabase
      .rpc('get_unread_notification_count', {
        p_user_id: user.user.id
      });

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

export const markAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('mark_notification_read', {
        p_notification_id: notificationId
      });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    toast.error('Failed to mark notification as read');
    return false;
  }
};

export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
): Promise<string | null> => {
  try {
    const { data: notificationId, error } = await supabase
      .rpc('create_notification', {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_message: message,
        p_data: data
      });

    if (error) throw error;
    return notificationId;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export const subscribeToNotifications = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('notifications-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications' },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: string;
  message: string;
  created_at: string;
  read: boolean;
}

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for new notifications
    const notificationsChannel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'admin_notifications' 
        },
        (payload) => {
          console.log('New admin notification:', payload);
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(count => count + 1);
          
          // Show toast for new notification
          toast.info(newNotification.type, {
            description: newNotification.message
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      // Try to fetch from admin_notifications table
      let { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        // If table doesn't exist, use fallback data
        console.warn("Error fetching admin notifications:", error);
        
        // Fetch recent orders, doctor registrations, etc. as notifications
        const recentActivity = await fetchRecentActivity();
        setNotifications(recentActivity);
        setUnreadCount(recentActivity.filter(n => !n.read).length);
        return;
      }

      setNotifications(data as Notification[]);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error("Error in fetchNotifications:", error);
    }
  };

  const fetchRecentActivity = async (): Promise<Notification[]> => {
    const activity: Notification[] = [];
    
    try {
      // Get recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, created_at, doctor:doctor_id(name)')
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (recentOrders) {
        recentOrders.forEach(order => {
          activity.push({
            id: `order-${order.id}`,
            type: 'New Order',
            message: `New order placed by ${order.doctor?.name || 'a doctor'}`,
            created_at: order.created_at,
            read: false
          });
        });
      }
      
      // Get recent doctor registrations
      const { data: recentDoctors } = await supabase
        .from('doctors')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (recentDoctors) {
        recentDoctors.forEach(doctor => {
          activity.push({
            id: `doctor-${doctor.id}`,
            type: 'New Doctor',
            message: `${doctor.name} registered as a new doctor`,
            created_at: doctor.created_at,
            read: false
          });
        });
      }
      
      // Sort by created_at
      return activity.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [];
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Try to update in database
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) {
        console.warn("Error marking notification as read:", error);
      }
      
      // Update local state regardless of database success
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error in markAsRead:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Try to update in database
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false);
        
      if (error) {
        console.warn("Error marking all notifications as read:", error);
      }
      
      // Update local state regardless of database success
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error in markAllAsRead:", error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white" 
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 border-b last:border-0 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm">{notification.type}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No notifications
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AdminNotifications;
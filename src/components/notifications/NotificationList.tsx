
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { 
  fetchNotifications, 
  markAsRead, 
  type Notification 
} from "@/services/notificationService";

interface NotificationListProps {
  onNotificationRead?: () => void;
}

export const NotificationList = ({ onNotificationRead }: NotificationListProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await fetchNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markAsRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      onNotificationRead?.();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_placed':
        return '🛒';
      case 'order_accepted':
        return '✅';
      case 'order_declined':
        return '❌';
      case 'invoice_generated':
        return '📄';
      case 'payment_received':
        return '💰';
      case 'order_status_update':
        return '📦';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="font-semibold">Notifications</h3>
        <Badge variant="secondary" className="text-xs">
          {notifications.filter(n => !n.read).length} new
        </Badge>
      </div>
      
      <ScrollArea className="h-80">
        <div className="space-y-1">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                notification.read 
                  ? 'bg-gray-50 hover:bg-gray-100' 
                  : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
              }`}
              onClick={() => !notification.read && handleMarkAsRead(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 text-lg">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${
                      notification.read ? 'text-gray-600' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                  <p className={`text-xs ${
                    notification.read ? 'text-gray-500' : 'text-gray-700'
                  } mt-1`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="border-t pt-2 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {/* Navigate to notifications page */}}
        >
          View All Notifications
        </Button>
      </div>
    </div>
  );
};

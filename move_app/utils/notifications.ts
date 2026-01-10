import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType = 'booking' | 'ride' | 'service' | 'general';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  data?: any;
}

export const addNotification = async (
  customerId: string,
  title: string,
  message: string,
  type: NotificationType = 'general',
  data?: any
): Promise<void> => {
  try {
    console.log('addNotification called with:', { customerId, title, type });
    
    const notificationsKey = `notifications_${customerId}`;
    const storedNotifications = await AsyncStorage.getItem(notificationsKey);
    
    console.log('Existing notifications:', storedNotifications ? 'found' : 'none');
    
    const notifications: Notification[] = storedNotifications 
      ? JSON.parse(storedNotifications) 
      : [];

    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      data,
    };

    console.log('Creating notification:', newNotification);

    notifications.unshift(newNotification); // Add to beginning

    // Keep only last 50 notifications
    const trimmedNotifications = notifications.slice(0, 50);

    await AsyncStorage.setItem(notificationsKey, JSON.stringify(trimmedNotifications));
    
    console.log('Notification saved successfully. Total count:', trimmedNotifications.length);
  } catch (error) {
    console.error('Error adding notification:', error);
  }
};

export const getUnreadCount = async (customerId: string): Promise<number> => {
  try {
    const notificationsKey = `notifications_${customerId}`;
    const storedNotifications = await AsyncStorage.getItem(notificationsKey);
    
    if (!storedNotifications) return 0;

    const notifications: Notification[] = JSON.parse(storedNotifications);
    return notifications.filter(n => !n.read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadNotifications();
      
      // Subscribe to real-time changes
      const subscription = supabase
        .channel('notifications_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`
          }, 
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Try Supabase first
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const transformedNotifications = data.map(transformNotification);
        setNotifications(transformedNotifications);
        setUnreadCount(transformedNotifications.filter(n => !n.isRead).length);
      } else {
        // Fallback to localStorage
        const localNotifications = localStorage.getItem(`notifications_${userId}`);
        if (localNotifications) {
          const notifications = JSON.parse(localNotifications);
          setNotifications(notifications);
          setUnreadCount(notifications.filter((n: Notification) => !n.isRead).length);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      
      // Fallback to localStorage
      const localNotifications = localStorage.getItem(`notifications_${userId}`);
      if (localNotifications) {
        const notifications = JSON.parse(localNotifications);
        setNotifications(notifications);
        setUnreadCount(notifications.filter((n: Notification) => !n.isRead).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const transformNotification = (data: any): Notification => ({
    id: data.id,
    type: data.type,
    title: data.title,
    message: data.message,
    recipientId: data.recipient_id,
    senderId: data.sender_id,
    relatedId: data.related_id,
    isRead: data.is_read,
    createdAt: new Date(data.created_at),
    data: data.data
  });

  const markAsRead = async (notificationId: string) => {
    try {
      // Try Supabase first
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (!error) {
        await loadNotifications();
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Fallback to localStorage
      const localNotifications = localStorage.getItem(`notifications_${userId}`);
      if (localNotifications) {
        let notifications = JSON.parse(localNotifications);
        notifications = notifications.map((n: Notification) => 
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
        setNotifications(notifications);
        setUnreadCount(notifications.filter((n: Notification) => !n.isRead).length);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      // Try Supabase first
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (!error) {
        await loadNotifications();
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Fallback to localStorage
      const localNotifications = localStorage.getItem(`notifications_${userId}`);
      if (localNotifications) {
        let notifications = JSON.parse(localNotifications);
        notifications = notifications.map((n: Notification) => ({ ...n, isRead: true }));
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
        setNotifications(notifications);
        setUnreadCount(0);
      }
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Try Supabase first
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (!error) {
        await loadNotifications();
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      // Fallback to localStorage
      const localNotifications = localStorage.getItem(`notifications_${userId}`);
      if (localNotifications) {
        let notifications = JSON.parse(localNotifications);
        notifications = notifications.filter((n: Notification) => n.id !== notificationId);
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
        setNotifications(notifications);
        setUnreadCount(notifications.filter((n: Notification) => !n.isRead).length);
      }
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshData: loadNotifications
  };
};
'use client';

import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'request_sent' | 'request_approved' | 'request_denied' | 'new_message' | 'item_reserved';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  userId: string;
  relatedItemId?: string;
  relatedUserId?: string;
}

interface TransactionStore {
  // Current user ID - in a real app this would come from auth
  currentUserId: string;
  
  // Notifications data
  notifications: Notification[];
  
  // Methods
  getNotificationsForUser: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
  markNotificationRead: (notificationId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
}

// Dummy data
const dummyNotifications: Notification[] = [
  {
    id: '1',
    type: 'request_approved',
    title: 'Request Approved',
    message: 'Your request for "Homemade Biryani" has been approved! You can now pick it up.',
    read: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    userId: 'user1',
    relatedItemId: 'item1',
    relatedUserId: 'user2',
  },
  {
    id: '2',
    type: 'request_sent',
    title: 'New Request',
    message: 'Someone wants to reserve your "Leftover Pizza Slices". Check your dashboard.',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    userId: 'user1',
    relatedItemId: 'item2',
    relatedUserId: 'user3',
  },
  {
    id: '3',
    type: 'item_reserved',
    title: 'Item Reserved',
    message: 'Your "Fresh Samosas" has been reserved by someone nearby.',
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    userId: 'user1',
    relatedItemId: 'item3',
    relatedUserId: 'user4',
  },
  {
    id: '4',
    type: 'request_denied',
    title: 'Request Declined',
    message: 'Your request for "Vegetable Curry" was declined. Try again later!',
    read: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    userId: 'user1',
    relatedItemId: 'item4',
    relatedUserId: 'user5',
  },
  {
    id: '5',
    type: 'new_message',
    title: 'New Message',
    message: 'You have a new message about your "Chicken Tikka" listing.',
    read: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    userId: 'user1',
    relatedItemId: 'item5',
    relatedUserId: 'user6',
  },
];

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  // Default user ID - in a real app this would be set after authentication
  currentUserId: 'user1',
  
  notifications: dummyNotifications,
  
  getNotificationsForUser: (userId: string) => {
    const { notifications } = get();
    return notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  
  getUnreadCount: (userId: string) => {
    const { notifications } = get();
    return notifications.filter(
      notification => notification.userId === userId && !notification.read
    ).length;
  },
  
  markNotificationRead: (notificationId: string) => {
    set((state) => ({
      notifications: state.notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      ),
    }));
  },
  
  addNotification: (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date(),
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },
}));
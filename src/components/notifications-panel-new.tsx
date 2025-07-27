'use client';

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, MessageSquare, Package, Star, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface NotificationsPanelNewProps {
  isOpen: boolean;
  onToggle: () => void;
  userId: Id<"users">;
}

export function NotificationsPanelNew({ isOpen, onToggle, userId }: NotificationsPanelNewProps) {
  // Get notifications
  const notifications = useQuery(api.notifications.getUserNotifications, {
    userId: userId,
    limit: 20,
  });

  // Get unread count
  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    userId: userId,
  });

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "listing_created":
      case "listing_sold":
      case "listing_expired":
        return <Package className="w-4 h-4 text-green-500" />;
      case "order_placed":
      case "order_accepted":
      case "order_rejected":
      case "order_completed":
        return <Package className="w-4 h-4 text-blue-500" />;
      case "contact_request":
      case "message_received":
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case "review_received":
        return <Star className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 border-red-200";
      case "high":
        return "bg-orange-100 border-orange-200";
      case "medium":
        return "bg-blue-100 border-blue-200";
      case "low":
        return "bg-gray-100 border-gray-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      try {
        await markAsRead({ notificationId: notification._id });
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Navigate if actionUrl is provided
    if (notification.actionUrl) {
      onToggle();
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteNotification = async (notificationId: Id<"notifications">) => {
    try {
      await deleteNotification({ notificationId });
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={onToggle}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-80 h-full bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
                {unreadCount && unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {unreadCount}
                  </Badge>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {unreadCount && unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-8 px-2 text-xs"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No notifications yet</h3>
                  <p className="text-sm text-gray-500">
                    We'll notify you when something important happens
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 border-l-2 rounded-r-lg ${
                        notification.isRead 
                          ? "bg-gray-50 border-gray-200" 
                          : getPriorityColor(notification.priority || "medium")
                      } hover:bg-gray-100 cursor-pointer relative group transition-colors`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className={`text-sm font-medium ${
                              notification.isRead ? "text-gray-600" : "text-gray-900"
                            }`}>
                              {notification.title}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification._id);
                              }}
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-red-100"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                          <p className={`text-xs ${
                            notification.isRead ? "text-gray-500" : "text-gray-700"
                          } mt-1 line-clamp-3`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                              {formatTimeAgo(notification._creationTime)}
                            </p>
                            {notification.sender && (
                              <p className="text-xs text-gray-500">
                                from {notification.sender.shopName || notification.sender.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-gray-50">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onToggle();
                  window.location.href = "/profile/orders";
                }}
              >
                View Orders & More
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, CheckCircle, AlertTriangle, Bell, MessageSquare } from 'lucide-react';
import { useTransactionStore } from '@/lib/transaction-store';
import { Button } from '@/components/ui/button';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { getNotificationsForUser, markNotificationRead, currentUserId } = useTransactionStore();
  const [activeTab, setActiveTab] = useState<'updates' | 'selling' | 'buying'>('updates');

  const allNotifications = getNotificationsForUser(currentUserId);
  
  const filteredNotifications = allNotifications.filter(notification => {
    switch (activeTab) {
      case 'updates':
        return true; 
      case 'selling':
        return ['request_sent', 'item_reserved'].includes(notification.type);
      case 'buying':
        return ['request_approved', 'request_denied', 'new_message'].includes(notification.type);
      default:
        return true;
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'request_sent':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'request_approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'request_denied':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'item_reserved':
        return <Bell className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-50 shadow-2xl z-50 flex flex-col"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Activity</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5 text-gray-600" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="p-2 bg-white">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {[
                  { label: 'Updates', value: 'updates' },
                  { label: 'Selling', value: 'selling' },
                  { label: 'Buying', value: 'buying' }
                ].map((tab) => (
                    <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value as 'updates' | 'selling' | 'buying')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 relative ${
                        activeTab === tab.value ? "text-gray-800" : "text-gray-500 hover:text-gray-700"
                    }`}
                    >
                    {activeTab === tab.value && (
                        <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white rounded-md shadow-sm"
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-20">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    {activeTab === 'updates' ? 'No activity yet' : 
                     activeTab === 'selling' ? 'No selling activity' : 
                     'No buying activity'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {activeTab === 'updates' ? 'Updates about your items will appear here.' :
                     activeTab === 'selling' ? 'Activity about your listed items will appear here.' :
                     'Activity about items you\'re interested in will appear here.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => markNotificationRead(notification.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                      notification.read
                        ? "bg-white border-gray-200 hover:bg-gray-100"
                        : "bg-orange-50 border-orange-200 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm text-gray-800">
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(notification.createdAt)}
                          </span>
                          {!notification.read && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {notification.message}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

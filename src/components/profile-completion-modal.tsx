'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { useProfileCompletion } from '@/hooks/use-profile-completion';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileCompletionModal({ isOpen, onClose }: ProfileCompletionModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const { missingFields, completionPercentage } = useProfileCompletion();
  
  const handleUpdateProfile = () => {
    onClose();
    router.push('/profile');
  };

  const handleRemindLater = () => {
    onClose();
    // Set a flag in localStorage to not show again for 24 hours
    localStorage.setItem('profileReminderDismissed', new Date().toISOString());
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
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-full">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Complete Your Profile</h2>
                    <p className="text-white/90 text-sm">
                      Get more visibility and trust from buyers
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                    <span className="text-sm font-bold text-orange-600">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                    />
                  </div>
                </div>

                {/* Missing Fields */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Missing Information
                  </h3>
                  <div className="space-y-2">
                    {missingFields.slice(0, 4).map((field, index) => (
                      <motion.div
                        key={field}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                        {field}
                      </motion.div>
                    ))}
                    {missingFields.length > 4 && (
                      <p className="text-xs text-gray-500 ml-4">
                        +{missingFields.length - 4} more fields missing
                      </p>
                    )}
                  </div>
                </div>

                {/* Benefits */}
                <div className="mb-6 bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Benefits of Complete Profile
                  </h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Higher visibility in search results</li>
                    <li>• Increased buyer trust and confidence</li>
                    <li>• Better engagement with your listings</li>
                    <li>• Access to premium features</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleUpdateProfile}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    Update Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    onClick={handleRemindLater}
                    variant="outline"
                    className="px-4 text-black"
                  >
                    Later
                  </Button>
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  Complete your profile to unlock the full potential of Saajha Rasoi
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
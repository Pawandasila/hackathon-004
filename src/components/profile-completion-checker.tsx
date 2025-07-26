'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useProfileCompletion } from '@/hooks/use-profile-completion';
import ProfileCompletionModal from './profile-completion-modal';

export default function ProfileCompletionChecker() {
  const { user, isLoaded } = useUser();
  const { isComplete, completionPercentage } = useProfileCompletion();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Don't show modal if profile is complete
    if (isComplete) return;

    // Don't show modal if completion is less than 50% (user is probably just starting)
    if (completionPercentage < 50) return;

    // Check if user dismissed the reminder recently (within 24 hours)
    const dismissedTime = localStorage.getItem('profileReminderDismissed');
    if (dismissedTime) {
      const dismissed = new Date(dismissedTime);
      const now = new Date();
      const hoursSinceDismissed = (now.getTime() - dismissed.getTime()) / (1000 * 60 * 60);
      
      // Don't show modal if dismissed within last 24 hours
      if (hoursSinceDismissed < 24) return;
    }

    // Show modal after a short delay to avoid jarring experience
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoaded, user, isComplete, completionPercentage]);

  // Don't render anything if user is not loaded or authenticated
  if (!isLoaded || !user) return null;

  return (
    <ProfileCompletionModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
    />
  );
}
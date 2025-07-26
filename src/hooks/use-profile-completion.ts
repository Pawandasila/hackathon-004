'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { calculateProfileCompletion, ProfileCompletionStatus } from '@/lib/profile-completion';

export function useProfileCompletion(): ProfileCompletionStatus & {
  checkCompletion: () => void;
} {
  const { user } = useUser();
  const [status, setStatus] = useState<ProfileCompletionStatus>({
    isComplete: true,
    missingFields: [],
    completionPercentage: 100,
  });

  const checkCompletion = () => {
    const result = calculateProfileCompletion(user);
    setStatus(result);
  };

  useEffect(() => {
    checkCompletion();
  }, [user]);

  return {
    ...status,
    checkCompletion,
  };
}
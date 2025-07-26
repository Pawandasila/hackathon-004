'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useConvexQuery } from './user-convex-query';
import { api } from '../../convex/_generated/api';
import { calculateProfileCompletion, ProfileCompletionStatus } from '@/lib/profile-completion';

export function useProfileCompletion(): ProfileCompletionStatus & {
  checkCompletion: () => void;
} {
  const { user, isLoaded } = useUser();
  const { data: convexUser, isLoading: isConvexLoading } = useConvexQuery(api.users.getCurrentUser);
  const [status, setStatus] = useState<ProfileCompletionStatus>({
    isComplete: false,
    missingFields: [],
    completionPercentage: 0,
  });

  const checkCompletion = () => {
    // Don't calculate completion if data is still loading
    if (!isLoaded || isConvexLoading) {
      return;
    }
    
    const result = calculateProfileCompletion(user, convexUser);
    setStatus(result);
  };

  useEffect(() => {
    checkCompletion();
  }, [user, convexUser, isLoaded, isConvexLoading]);

  return {
    ...status,
    checkCompletion,
  };
}
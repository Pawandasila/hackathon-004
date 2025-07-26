import { UserResource } from '@clerk/types';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

export function calculateProfileCompletion(
  user: UserResource | null | undefined, 
  convexUser?: any
): ProfileCompletionStatus {
  if (!user) {
    return {
      isComplete: false,
      missingFields: ['User not logged in'],
      completionPercentage: 0,
    };
  }

  const missingFields: string[] = [];
  
  // Check required fields with priority: Convex DB -> Clerk user object -> Clerk metadata
  const requiredFields = [
    { 
      key: 'firstName', 
      label: 'First Name', 
      value: convexUser?.firstName || user.firstName || user.unsafeMetadata?.firstName 
    },
    { 
      key: 'lastName', 
      label: 'Last Name', 
      value: convexUser?.lastName || user.lastName || user.unsafeMetadata?.lastName 
    },
    { 
      key: 'profileImage', 
      label: 'Profile Image', 
      value: convexUser?.imageUrl || user.imageUrl 
    },
    { 
      key: 'phoneNumber', 
      label: 'Phone Number', 
      value: convexUser?.phone || user.phoneNumbers?.[0]?.phoneNumber 
    },
    { 
      key: 'shopName', 
      label: 'Shop Name', 
      value: convexUser?.shopName || user.publicMetadata?.shopName 
    },
    { 
      key: 'shopImage', 
      label: 'Shop Image', 
      value: convexUser?.shopImage || user.publicMetadata?.shopImage 
    },
    { 
      key: 'address', 
      label: 'Address', 
      value: convexUser?.shopAddress || user.publicMetadata?.address 
    },
    { 
      key: 'bio', 
      label: 'Bio/Description', 
      value: convexUser?.bio || user.publicMetadata?.bio 
    },
  ];

  requiredFields.forEach(field => {
    if (!field.value || field.value === '') {
      missingFields.push(field.label);
    }
  });

  // Debug logging (remove in production)
  console.log('Profile Completion Debug:', {
    convexUser: !!convexUser,
    missingFields,
    requiredFields: requiredFields.map(f => ({ key: f.key, hasValue: !!f.value }))
  });

  const completionPercentage = Math.round(
    ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
  );

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completionPercentage,
  };
}
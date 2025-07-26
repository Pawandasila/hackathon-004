import { UserResource } from '@clerk/types';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

export function calculateProfileCompletion(user: UserResource | null | undefined): ProfileCompletionStatus {
  if (!user) {
    return {
      isComplete: false,
      missingFields: ['User not logged in'],
      completionPercentage: 0,
    };
  }

  const missingFields: string[] = [];
  const requiredFields = [
    { key: 'firstName', label: 'First Name', value: user.firstName },
    { key: 'lastName', label: 'Last Name', value: user.lastName },
    { key: 'profileImage', label: 'Profile Image', value: user.imageUrl },
    { key: 'phoneNumber', label: 'Phone Number', value: user.phoneNumbers?.[0]?.phoneNumber },
    // Check user metadata for additional fields
    { key: 'shopName', label: 'Shop Name', value: user.publicMetadata?.shopName },
    { key: 'shopImage', label: 'Shop Image', value: user.publicMetadata?.shopImage },
    { key: 'address', label: 'Address', value: user.publicMetadata?.address },
    { key: 'bio', label: 'Bio/Description', value: user.publicMetadata?.bio },
  ];

  requiredFields.forEach(field => {
    if (!field.value || field.value === '') {
      missingFields.push(field.label);
    }
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